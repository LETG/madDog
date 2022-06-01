const tools = (function() {
    const eventName = "tools-componentLoaded";
    var create = new Event(eventName);
    document.addEventListener(eventName, () => console.log("Tools lib loaded !"))
    document.dispatchEvent(create);

    return {
        view: () => mviewer.getMap().getView(),
        setZoom: (z) => tools.view().setZoom(z),
        getZoom: () => tools.view().getZoom(),
        getMvLayerById: (id) => mviewer.getMap().getLayers().getArray().filter(l => l.get('mviewerid') === id)[0],
        zoomToWMSLayerExtent: (layer, ns, asHome = false) => {
            if (!mviewer.getLayer(layer)) return;
            const url = mviewer.getLayer(layer).url + "?service=WMS&version=1.1.0&request=GetCapabilities&namespace=" + ns;
            fetch(url).then(function(response) {
                return response.text();
                }).then(function(text) {
                    const reader = new ol.format.WMSCapabilities();
                    const infos = reader.read(text);
                    const extent = _.find(infos.Capability.Layer.Layer, ["Name", layer]).BoundingBox[0].extent;
                    maddog.bbox = extent;
                    // wait 2000 ms correct map size to zoom correctly
                    tools.zoomToExtent(maddog.bbox, {duration: 0}, 2000);
                    if (asHome) {
                        mviewer.zoomToInitialExtent = () => {
                            tools.zoomToExtent(maddog.bbox);
                        };
                    }
            })
        },
        zoomToWFSLayerExtent: (layer, asHome = false) => {
            // generate a GetFeature request
            const featureRequest = new ol.format.WFS().writeGetFeature({
                srsName: 'EPSG:3857',
                featureTypes: [layer],
                outputFormat: 'application/json'
            });
        
            // then post the request and add the received features to a layer
            fetch(mviewer.getLayer(layer).url.replace("wms","wfs"), {
                method: 'POST',
                body: new XMLSerializer().serializeToString(featureRequest),
            }).then(function(response) {
                return response.json();
            }).then(function(json) {
                const layerExtentInit = new ol.source.Vector();
                const features = new ol.format.GeoJSON().readFeatures(json);
                layerExtentInit.addFeatures(features);
                const extent = layerExtentInit.getExtent();
                maddog.bbox = extent;
                // wait 2000 ms correct map size to zoom correctly
                tools.zoomToExtent(maddog.bbox, {duration: 0}, 2000);
                if (asHome) {
                    mviewer.zoomToInitialExtent = () => {
                        tools.zoomToExtent(maddog.bbox);
                    };
                }
            });
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
        zoomToExtent: (extent, props, time) => {
            // NEED REPROJECTION FOR EMPRISE !
            const overlay = tools.getMvLayerById("featureoverlay");
            const duration = 1000;
            const displayTime = 3000;
            const fit = () => {
                mviewer.getMap().getView().fit(
                    extent,
                    {
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
        featureToOverlay: (feature) => {
            const overlay = tools.getMvLayerById("featureoverlay").getSource();
            overlay.clear();
            overlay.addFeature(feature);
        },
        init: (component) => {
            this.getCfg = (i) => _.get(mviewer.customComponents[component], i);
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
         * @returns 
         */
        initFuseSearch: (id) => wfs2Fuse.initSearch(
            getCfg(`config.options.${id}.url`),
            getCfg(`config.options.${id}.fuseOptions`),
            id,
            (d) => {
                maddog[id] = d
            }
        ),
        getGFIUrl: (coordinate, layerId, callback) => {
            const viewResolution = /** @type {number} */ (mviewer.getMap().getView().getResolution());
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
        findCommuneOnClick: (coordinate) => {
            tools.getGFIUrl(coordinate, "communewithsite", (feature) => {
                if (feature) {
                    tools.zoomToJSONFeature(feature, "EPSG:3857");
                }
            });
        },
        findSiteOnClick: (coordinate) => {
            tools.getGFIUrl(coordinate, "sitebuffer", (feature) => {
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
        onClickAction: () => {
            if (maddog.singleclick) return;
            maddog.singleclick = true;
            mviewer.getMap().on('singleclick', function (evt) {
                // don't use actions to avoid conflict with TDC draw refline
                if (maddog.drawStart) return;
                document.getElementById("siteName").innerHTML = "Aucun site sélectionné !";
                tools.findSiteOnClick(evt.coordinate);
                // enable feature selection for some features only
                mviewer.getMap().forEachFeatureAtPixel(
                    evt.pixel,
                    function (feature) {
                        if (feature.getProperties()) {
                            const props = feature.getProperties();
                            prfUtils.getPrfByProfilAndIdSite(props.idsite, props.idtype);
                        }
                    },
                    {
                        layerFilter: (l) => ["refline"].includes(l.getProperties().mviewerid)
                    }
                );
            });
        },
        setIdSite: (idsite, namesite) => {
            maddog.idsite = idsite;
            document.getElementById("siteName").innerHTML = _.capitalize(namesite);
            document.getElementById("WPSnoselect").style.display = "none";
            document.getElementById("btn-wps-tdc").classList.remove("disabled");
            document.getElementById("btn-wps-pp").classList.remove("disabled");
            document.getElementById("btn-wps-mnt").classList.remove("disabled");
        },
        initServicebyMenu: () => {
            tdcUtils.tdcReset(true);
            if (maddog.idsite && !TDC_WPS.hidden) {
                tdcUtils.getReferenceLine(maddog.idsite);
                tdcUtils.getTDCByIdSite(maddog.idsite);
            }
            if (maddog.idsite && !PP_WPS.hidden) {
                prfUtils.getPrfRefLines(maddog.idsite);
            }
        },
        showHideMenu: (ele) => {
            ele.hidden = !ele.hidden;
            selectWPS.hidden = !selectWPS.hidden;
            tools.initServicebyMenu();
            if (TDC_WPS.hidden) {
                tdcUtils.tdcReset(true);
            }
            if (PP_WPS.hidden) {
                prfUtils.prfReset(true);
            }
        },
        downloadBlob: (content, filename, contentType) => {
            // Create a blob
            var blob = new Blob([content], { type: contentType });
            var url = URL.createObjectURL(blob);
          
            // Create a link to download it
            var pom = document.createElement('a');
            pom.href = url;
            pom.setAttribute('download', filename);
            pom.click();
        },
        addInteraction: (sourceLayer) => {
            let draw;
            let feature;

            draw = new ol.interaction.Draw({
                source: sourceLayer,
                type: 'LineString',
                id:"test"
            });

            sourceLayer.clear();  

            draw.on('drawend', function (evt) {
                // need to clone to keep default draw line
                feature = evt.feature.clone();
                // reproject draw line to work with WPS
                feature.getGeometry().transform("EPSG:3857", "EPSG:2154");
                // WPS only works if properties is not null
                feature.setProperties({ time: new Date().toISOString() });
                // create JSON
                const featureJSON = new ol.format.GeoJSON({ defaultDataProjection: "EPSG:2154" }).writeFeature(feature);
                // set drawRadial config
                maddog.setDrawRadialConfig({
                    drawReferenceLine: `<![CDATA[{"type":"FeatureCollection","features":[${featureJSON}]}]]>`
                });
                // close draw interaction
                mviewer.getMap().removeInteraction(draw);
            });

            mviewer.getMap().addInteraction(draw);
        },
        btnDrawline: (btn, idLayer) => {
            const sourceLayer = mviewer.getLayer(idLayer).layer.getSource();
            if (btn.className == "btn btn-default btn-danger") {
                btn.className = "btn btn-default";
                btn.innerHTML = "<span class='glyphicon glyphicon-pencil' aria-hidden='true'></span> Dessiner"; 
                sourceLayer.clear();  
                info.enable(); 
                maddog.setDrawRadialConfig({
                    drawReferenceLine: null
                });
                maddog.drawStart = false;
            } else {
                btn.className = "btn btn-default btn-danger";
                btn.innerHTML = "<span class='glyphicon glyphicon-remove' aria-hidden='true'></span> Annuler";
                maddog.drawStart = true;
                tools.addInteraction(sourceLayer);
                info.disable();
            }
        }
    }
})();