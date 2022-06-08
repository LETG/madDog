const tools = (function() {
    // PRIVATE
    // This allow to display a browser console message when this file is correctly loaded
    let highlightLR, selectedLR, defaultStyle, draw;
    const eventName = "tools-componentLoaded";
    const create = new Event(eventName);
    document.addEventListener(eventName, () => console.log("Tools lib loaded !"));
    // required and waiting by maddog.js PromisesAll
    document.dispatchEvent(create);

    return {
        // PUBLIC
        refLineStyle: (labels, color) => {
            return new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: color || "black",
                    width: 2
                }),
                text: labels ? labels : null
            })
        },
        view: () => mviewer.getMap().getView(),
        setZoom: (z) => tools.view().setZoom(z),
        getZoom: () => tools.view().getZoom(),
        getMvLayerById: (id) => mviewer.getMap().getLayers().getArray().filter(l => l.get('mviewerid') === id)[0],
        zoomToOGCLayerExtent: () => {
            const options = maddog.getCfg("config.options.defaultLayerZoom");
            if (!mviewer.getLayer(options.layer)) return;
            let url = options.url || mviewer.getLayer(options.layer).layer.getSource().getUrl();
            if (options.type === "wms" && !options.url) {
                url = url + "?service=WMS&version=1.1.0&request=GetCapabilities&namespace=" + options.namespace;
            }
            if (options.type === "wfs" && !options.url) {
                url = url.replace("wms", "wfs") + "?service=WFS&version=1.1.0&request=GetFeature&outputFormat=application/json&typeName=" + options.layer;
            }
            fetch(url).then(response => options.type === "wms" ? response.text() : response.json())
                .then(function(response) {
                    let reader = options.type === "wms" ? new ol.format.WMSCapabilities() : new ol.format.GeoJSON();
                    let extent;
                    if (options.type === "wms") {
                        const infos = reader.read(response);
                        extent = _.find(infos.Capability.Layer.Layer, ["Name", options.layer]).BoundingBox[0].extent;
                    }
                    if (options.type === "wfs") {
                        const layerExtentInit = new ol.source.Vector();
                        const features = reader.readFeatures(response);
                        layerExtentInit.addFeatures(features);
                        extent = layerExtentInit.getExtent();
                    }
                    maddog.bbox = extent;
                    // wait 2000 ms correct map size to zoom correctly
                    tools.zoomToExtent(maddog.bbox, {
                        duration: 0
                    }, 2000);
                    if (options.asHomeExtent) {
                        mviewer.zoomToInitialExtent = () => {
                            tools.zoomToExtent(maddog.bbox);
                        };
                    }
                })
        },
        zoomToJSONFeature: (jsonFeature, startProj, endProj) => {
            const outConfig = endProj && startProj ? {
                dataProjection: startProj,
                featureProjection: endProj
            } : {}
            const features = new ol.format.GeoJSON({
                defaultDataProjection: startProj
            }).readFeatures(jsonFeature, outConfig);
            if (features.length) {
                tools.zoomToExtent(features[0].getGeometry().getExtent());
            }
        },
        /**
         * Zoom to a specific map extent - EPSG:3857 required by default
         * @param {Array} extent 
         * @param {object} props to override default extent animaitons or others options
         * @param {Number} time in ms
         * @returns 
         */
        zoomToExtent: (extent, props, time) => {
            // NEED REPROJECTION FOR EMPRISE !
            const overlay = tools.getMvLayerById("featureoverlay");
            const duration = 1000;
            const displayTime = 3000;
            const fit = () => {
                mviewer.getMap().getView().fit(
                    extent, {
                        size: mviewer.getMap().getSize(),
                        padding: [100, 100, 100, 100],
                        duration: duration,
                        ...props
                    }
                );
            };

            if (!extent || !overlay) return;
            if (time) {
                setTimeout(() => fit(), time);
            } else {
                fit();
            }
            setTimeout(() => overlay.getSource().clear(), displayTime);
        },
        /**
         * Create an overlay from feature
         * @param {ol.Feature} feature 
         */
        featureToOverlay: (feature) => {
            const overlay = tools.getMvLayerById("featureoverlay").getSource();
            overlay.clear();
            overlay.addFeature(feature);
        },
        /**
         * Init this file
         * @param {string} component mviewer id
         */
        init: (component) => {
            this.getCfg = (i) => _.get(mviewer.customComponents[component], i);
            document.addEventListener("start-wps", tools.onStartWPS);
            document.addEventListener("stop-wps", tools.onStopWps);
        },
        /**
         * Check or wait a plugin or lib
         * @param {string} id 
         * @param {boolean} ready 
         * @returns {function}
         */
        waitPlugin: (id, ready) => new Promise((resolve, reject) => {

            if (!ready) {
                document.addEventListener(`${id}-componentLoaded`, resolve(true));
            } else {
                resolve(true)
            }
        }),
        /**
         * Init Fuse Search by layer
         * @returns nothing
         */
        initFuseSearch: (id) => wfs2Fuse.initSearch(
            getCfg(`config.options.${id}.url`),
            getCfg(`config.options.${id}.fuseOptions`),
            id,
            (d) => {
                maddog[id] = d
            }
        ),
        /**
         * From a layer id we return a geoserver GFI Url
         * @param {Array} coordinate 
         * @param {string} layerId mviewer layer id
         * @param {Function} callback 
         */
        getGFIUrl: (coordinate, layerId, callback) => {
            const viewResolution = mviewer.getMap().getView().getResolution();
            const urlSite = mviewer.getLayer(layerId).layer.getSource().getFeatureInfoUrl(
                coordinate,
                viewResolution,
                'EPSG:3857', {
                    'INFO_FORMAT': 'application/json'
                }
            );
            if (urlSite) {
                axios.get(urlSite)
                    .then((response) => response.data.features ? response.data.features[0] : [])
                    .then((feature) => {
                        callback(feature);
                    });
            }
        },
        /**
         * From coordinates, we request commune WFS layer
         * @param {Array} coordinate 
         */
        findCommuneOnClick: (coordinate) => {
            tools.getGFIUrl(coordinate, "communewithsite", (feature) => {
                if (feature) {
                    tools.zoomToJSONFeature(feature, "EPSG:3857");
                }
            });
        },
        /**
         * From coordinates, we sites WFS layer
         * @param {Array} coordinate 
         */
        findSiteOnClick: (coordinate) => {
            let res = mviewer.getMap().getView().getResolution();
            if (res < mviewer.getLayer("sitebuffer").layer.getMinResolution()) {
                return;
            }
            tools.getGFIUrl(coordinate, "sitebuffer", (feature) => {
                if (!feature) {
                    document.getElementById("siteName").innerHTML = "Aucun site sélectionné !";
                }
                if (feature && feature.properties.idsite === maddog.idsite) return;
                if (feature) {
                    tools.setIdSite(feature.properties.idsite, feature.properties.namesite);
                    tools.zoomToJSONFeature(feature, "EPSG:3857");
                    // init service
                    tools.initServicebyMenu();
                } else {
                    maddog.idsite = null;
                    tools.findCommuneOnClick(coordinate);
                }
            });
        },
        /**
         * Reset selected Reference Line feature style
         */
        resetSelectedLR: () => {
            if (tools.getSelectedLR()) {
                tools.setSelectedLR(
                    tools.getSelectedLR().setStyle(prfUtils.profilsStyle(tools.getSelectedLR()))
                );
                prfUtils.prfReset();
            }
        },
        /**
         * Get selected Ref Line
         * @returns ol.Feature Ref Line selected
         */
        getSelectedLR: () => selectedLR,
        /**
         * Set new selected Ref Line as
         * @param {ol.Feature} lr feature clicked
         */
        setSelectedLR: (lr) => {
            selectedLR = lr
        },
        /**
         * Create singleclick event to search commune, site or select Ref Line
         * @returns nothing
         */
        onClickAction: () => {
            if (maddog.singleclick) return;
            maddog.singleclick = true;
            mviewer.getMap().on('singleclick', function(evt) {
                // don't use actions to avoid conflict with TDC draw refline
                if (maddog.drawStart) return;
                tools.findSiteOnClick(evt.coordinate);
                tools.resetSelectedLR();
                // enable feature selection for some features only
                mviewer.getMap().forEachFeatureAtPixel(
                    evt.pixel,
                    (f) => {
                        if (selectedLR && f.get("ogc_fid") == selectedLR.get("ogc_fid")) return;
                        if (f.getProperties() && !PP_WPS.hidden) {
                            prfUtils.onSelectLr(f.get("idtype"));
                            document.getElementById('selectProfil').value = f.get("idtype");
                            return true;
                        }
                        if (selectedLR && !f.getProperties()) {
                            selectedLR.setStyle(prfUtils.profilsStyle(defaultStyle));
                        }
                    }, {
                        hitTolerance: 10,
                        layerFilter: (l) => ["refline"].includes(l.getProperties().mviewerid)
                    }
                );
            });
        },
        /**
         * Highlight feature Ref Line only if Beach Profile is open
         */
        highlightFeature: () => {
            mviewer.getMap().on('pointermove', function(e) {
                if (selectedLR) return;
                if (highlightLR) {
                    highlightLR.setStyle(defaultStyle);
                    highlightLR = null;
                }
                mviewer.getMap().forEachFeatureAtPixel(
                    e.pixel,
                    (f, layer) => {
                        // change style on mouse hover PRF feature
                        highlightLR = f;
                        defaultStyle = f.getStyle();
                        highlightLR.setStyle(prfUtils.profilsStyle(f, maddog.getCfg("config.options.highlight.prf"), true));
                        return true;
                    }, {
                        hitTolerance: 10,
                        layerFilter: (l) => ["refline"].includes(l.getProperties().mviewerid)

                    }
                );
            });
        },
        /**
         * Change many UI info to display selected site
         * @param {String} idsite 
         * @param {String} namesite 
         */
        setIdSite: (idsite, namesite) => {
            maddog.idsite = idsite;
            document.getElementById("siteName").innerHTML = _.capitalize(namesite);
            document.getElementById("WPSnoselect").style.display = "none";
            document.getElementById("btn-wps-tdc").classList.remove("disabled");
            document.getElementById("btn-wps-pp").classList.remove("disabled");
            document.getElementById("btn-wps-mnt").classList.remove("disabled");
        },
        /**
         * Select or deselect all values for a given multiselect component
         * @param {any} id
         * @param {String} action
         * @param {any} lib as prfUtils or tdcUtils
         */
        multiSelectBtnReset: (id, action, lib) => {
            if (action === "selectAll") {
                lib.multiSelectBtn('selectAll');
            } else {
                lib.multiSelectBtn('deselectAll');
            }
            $("#" + id).multiselect("updateButtonText");
        },
        /**
         * Init service according to clicked menu
         */
        initServicebyMenu: () => {
            tdcUtils.tdcReset(true);
            if (maddog.idsite && !TDC_WPS.hidden) {
                tdcUtils.getReferenceLine(maddog.idsite);
                tdcUtils.getTDCByIdSite(maddog.idsite);
            }
            if (maddog.idsite && !PP_WPS.hidden) {
                prfUtils.prfReset(true);
                prfUtils.getPrfRefLines(maddog.idsite);
                prfUtils.manageError("Vous devez choisir un site, un profil et au moins 2 dates !", '<i class="fas fa-exclamation-circle"></i>');
            }
        },
        /**
         * Manage UI according to clicked card
         * @param {any} ele element HTML clicked
         */
        showHideMenu: (ele) => {
            ele.hidden = !ele.hidden;
            selectWPS.hidden = !selectWPS.hidden;
            tools.initServicebyMenu();
            if (TDC_WPS.hidden) {
                tdcUtils.tdcReset(true);
            }
            if (PP_WPS.hidden) {
                prfUtils.prfReset(true, '<i class="fas fa-exclamation-circle"></i> Vous devez choisir un site, un profil et au moins 2 dates !');
            }
        },
        /**
         * From a content file we create and download file as CSV
         * @param {any} content file
         * @param {String} filename 
         * @param {String} contentType 
         */
        downloadBlob: (content, filename, contentType) => {
            // Create a blob
            var blob = new Blob([content], {
                type: contentType
            });
            var url = URL.createObjectURL(blob);

            // Create a link to download it
            var pom = document.createElement('a');
            pom.href = url;
            pom.setAttribute('download', filename);
            pom.click();
        },
        /**
         * Manage draw reference line for TDC param
         * @param {ol.source} sourceLayer 
         */
        addInteraction: (sourceLayer) => {
            let feature;

            sourceLayer.clear();

            draw = new ol.interaction.Draw({
                source: sourceLayer,
                type: 'LineString'
            });

            draw.on('drawend', function(evt) {
                maddog.drawRefLine = evt.feature;
                // clean layers
                mviewer.getLayer("radiales").layer.getSource().clear();
                mviewer.getLayer("refline").layer.getSource().clear();
                // need to clone to keep default draw line
                feature = evt.feature.clone();
                // reproject draw line to work with WPS
                feature.getGeometry().transform("EPSG:3857", "EPSG:2154");
                // WPS only works if properties is not null
                feature.setProperties({
                    time: new Date().toISOString()
                });
                // create JSON
                const featureJSON = new ol.format.GeoJSON({
                    defaultDataProjection: "EPSG:2154"
                }).writeFeature(feature);
                // set drawRadial config
                maddog.setDrawRadialConfig({
                    drawReferenceLine: `<![CDATA[{"type":"FeatureCollection","features":[${featureJSON}]}]]>`
                });
                // close draw interaction
                mviewer.getMap().removeInteraction(draw);
                $("#coastlinetrackingBtn").show();
            });

            mviewer.getMap().addInteraction(draw);
        },
        /**
         * Callback triggerd on TDC Ref Line draw click button
         * @param {any} btn clicked
         * @param {String} idLayer mviewer layer id
         * @param {Boolean} deactivate
         */
        btnDrawline: (btn, idLayer, deactivate) => {
            const sourceLayer = mviewer.getLayer(idLayer).layer.getSource();
            if (btn.className == "btn btn-default btn-danger" || deactivate) {
                btn.className = "btn btn-default";
                btn.innerHTML = "<span class='glyphicon glyphicon-pencil' aria-hidden='true'></span> Dessiner";
                sourceLayer.clear();
                // clean radiales
                mviewer.getLayer("radiales").layer.getSource().clear();
                info.enable();
                maddog.setDrawRadialConfig({
                    drawReferenceLine: null
                });
                maddog.drawStart = false;
                // close draw interaction
                mviewer.getMap().removeInteraction(draw);
                $("#coastlinetrackingBtn").show();
            } else {
                btn.className = "btn btn-default btn-danger";
                btn.innerHTML = "<span class='glyphicon glyphicon-remove' aria-hidden='true'></span> Annuler";
                maddog.drawStart = true;
                tools.addInteraction(sourceLayer);
                info.disable();
            }
        },
        onStartWPS: () => {
            if (document.getElementById("titleChart1")) {
                document.getElementById("titleChart1").innerHTML = "";
            }
            if (document.getElementById("titleChart2")) {
                document.getElementById("titleChart2").innerHTML = "";
            }
            if (document.getElementById("tdcTauxChart")) {
                tdcTauxChart.remove();
            }
            if (document.getElementById("tdcDistanceChart")) {
                tdcDistanceChart.remove();
            }
            if (document.getElementById("prfBilanSedChart")) {
                prfBilanSedChart.remove();
            }
            if (document.getElementById("pofilesDatesChart")) {
                $("#pofilesDates").empty();
            }
            [...document.getElementsByClassName("loaderWps")].forEach(e => { e.hidden = false });
        },
        onStopWps: () => [...document.getElementsByClassName("loaderWps")].forEach(e => { e.hidden = true })
    }
})();