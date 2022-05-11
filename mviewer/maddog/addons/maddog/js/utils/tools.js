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
        zoomToExtent: (extent) => {
            // NEED REPROJECTION FOR EMPRISE !
            const overlay = tools.getMvLayerById("featureoverlay");
            const duration = 1000;
            const displayTime = 3000;
            if (!extent || !overlay) return;
            mviewer.getMap().getView().fit(
                extent,

                {
                    size: mviewer.getMap().getSize(),
                    padding: [100, 100, 100, 100],
                    duration: duration
                }
            );
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
        onClickAction: () => {
            mviewer.getMap().on('singleclick', function(evt) {
                document.getElementById("siteName").innerHTML = "Aucun site sélectionné !";
                const viewResolution = /** @type {number} */ (mviewer.getMap().getView().getResolution());
                const url = mviewer.getLayer("sitebuffer").layer.getSource().getFeatureInfoUrl(
                    evt.coordinate,
                    viewResolution,
                    'EPSG:3857', {
                        'INFO_FORMAT': 'application/json'
                    }
                );
                if (url) {
                    axios.get(url)
                        .then((response) => response.data.features ? response.data.features[0] : [])
                        .then((feature) => {
                            tdcUtils.tdcReset(true);
                            if (feature) {                    
                                if (!TDC_WPS.hidden) {
                                    // récupération de la ligne de référence utile pour la radiale et le coastline tracking
                                    tdcUtils.getReferenceLine(feature.properties.idsite);
                                }
                                tools.zoomToJSONFeature(feature, "EPSG:3857");
                                document.getElementById("siteName").innerHTML = feature.properties.idsite;
                                maddog.idsite = feature.properties.idsite;
                            } else {
                                maddog.idsite = null;
                            }
                        })
                }
            });
        },
        showHideMenu: (ele) => {
            ele.hidden = !ele.hidden;
            selectWPS.hidden = !selectWPS.hidden;
            if (maddog.idsite && !TDC_WPS.hidden) {
                tdcUtils.getTDCByIdSite(maddog.idsite);
            }
            if (TDC_WPS.hidden) {
                tdcUtils.tdcReset(true);
            }
        }
    }
})();