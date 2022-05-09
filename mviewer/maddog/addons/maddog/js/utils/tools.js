const tools = (function() {
    const eventName = "tools-componentLoaded";
    var create = new Event(eventName);
    document.addEventListener(eventName, () => console.log("Tools lib loaded !"))
    document.dispatchEvent(create);

    const defaultClickedStyle = new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0)',
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(55, 52, 79)',
            width: 1.4,
        })
    });

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
        initButton: (buttonId, action) => {
            document.getElementById(buttonId).onclick = action;
        },
        initEmpriseClickCtrl: () => {
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
                            if (feature) {
                                tools.zoomToJSONFeature(feature, "EPSG:3857");
                                document.getElementById("siteName").innerHTML = feature.properties.idsite;
                                // récupération de la ligne de référence utile pour la radiale et le coastline tracking
                                tools.getReferenceLine(feature.properties.idsite);
                            }
                        })
                }
            });

        },
        getReferenceLine: (idsite) => {
            // On cherche la ligne de référence, entité de base aux autres traitements
            const lineRefUrl = 'https://gis.jdev.fr/geoserver/maddog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog%3Alineref&outputFormat=application%2Fjson&CQL_FILTER=idsite=';
            axios.get(`${lineRefUrl}'${idsite}'`)
                .then(lineRef => lineRef.data.features ? lineRef.data.features[0] : [])
                .then(feature => `<![CDATA[{"type":"FeatureCollection","features":[${JSON.stringify(feature)}]}]]>`)
                // A partir de la ligne de référence, on va maintenant calculer la radiale
                .then(geojson => maddog.setDrawRadialConfig({
                    referenceLine: geojson
                }))
                .then(() => tools.getTDCByIdSite(idsite));
        },
        getTDCByIdSite: (idsite) => {
            // on récupère ensuite le trait de côte utile pour le coastline tracking
            const tdcUrl = "https://gis.jdev.fr/geoserver/maddog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog:tdc&outputFormat=application/json&CQL_FILTER=idsite=";
            axios.get(`${tdcUrl}'${idsite}'`)
                // récupération du TDC
                .then(tdc => tdc.data.features ? tdc.data.features : [])
                // mise en forme du TDC
                .then(features => `<![CDATA[{"type":"FeatureCollection","features":[${JSON.stringify(features)}]}]]>`)
                // lancement WPS
                .then(tdcGeojson => maddog.setCoastLinesTrackingConfig({
                    tdc: tdcGeojson
                }))
                .then(() => wps.coastLineTracking(maddog.coastLinesTrackingConfig))
        },
        getRadiales: (r) => {
            console.log(">>>>>>>>>> RESULTAT DRAWLINE");
            console.log(r.responseDocument);
            // on affiche la radiale sur la carte
            let layer = mviewer.getLayer("radiales").layer;

            var style = new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "red"
                }),
                stroke: new ol.style.Stroke({
                    color: "black",
                    width: 2
                })
            });

            // save with EPSG:2154 for getDistance WPS
            maddog.radiales2154 = new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:2154'
            }).readFeatures(r.responseDocument);

            // display radiales on map with EPSG:3857
            let features = new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:2154'
            }).readFeatures(r.responseDocument, {
                dataProjection: 'EPSG:2154',
                featureProjection: 'EPSG:3857'
            });

            features.forEach(f => f.setStyle(style));

            layer.getSource().clear();
            layer.getSource().addFeatures(features);
            // on garde la radiale en config pour le coastline tracking
            maddog.setCoastLinesTrackingConfig({
                radiales: `<![CDATA[${JSON.stringify(r.responseDocument)}]]>`
            });
            wps.coastLineTracking(maddog.coastLinesTrackingConfig);

            tools.zoomToExtent(layer.getSource().getExtent());
        },
        addDatasetChart: (chart, dataset) => {
            chart.data.datasets.push(dataset);
            chart.update();
        },
        cleanDatasets: (chart) => {
            chart.data.datasets.pop()
        },
        cleanData: (chart, i) => {
            chart.data.labels.splice(i, 1);
            chart.data.datasets.forEach(d => d.data.pop());
            chart.update();
        },
        destroyChart: (chart) => {
            chart.destroy();
        },
        initNewChart: (datasets, labels, id) => {
            var config = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    title: {
                        display: true,
                        text: 'Custom Chart Title'
                    }
                }
            }
            new Chart(document.getElementById(id).getContext('2d'), config);
        },
        createDateLine: (dataDate, labels, field) => {
            let valByRadiale = [];
            // sort by radiale name for each date
            if (!dataDate.data.length) {
                // create reference line with 0 values for each labels
                valByRadiale = labels.map(() => 0);
            } else {
                valByRadiale = labels.map((radialeName, i) => {
                    const radialeValues = _.find(dataDate.data, ["radiale", radialeName])
                    return _.isEmpty(radialeValues) ? null : radialeValues[field];
                });
            }
            return {
                label: moment(dataDate.date).format("DD/MM/YYYY"),
                data: valByRadiale,
            };
        },
        tdcChart: (dates) => {
            let selected = maddog.charts.coastLines.result;
            let labels;
            if (dates) {
                selected = maddog.charts.coastLines.result.filter(r => dates.includes(r.date))
            };
            labels = _.uniq(_.spread(_.union)(selected.map(s => s.data.map(d => d.radiale)))).sort();
            labels = _.sortBy(labels);
            // create one line by date
            const lines = selected.map(s => {
                return tools.createDateLine(s, labels, "separateDist")
            });

            // return tools.testChart(lines, labels);
            tools.initNewChart(lines, labels, "tdc-chart");
        }, 
        showHideMenu: (ele) => {
            var srcElement = document.getElementById(ele);
            srcElement.hidden = !srcElement.hidden;
            selectWPS.hidden = !selectWPS.hidden;
        }
    }
})();