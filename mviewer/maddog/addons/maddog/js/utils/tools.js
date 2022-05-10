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
                .then(lineRef => {
                    maddog.refLine = lineRef.data;
                    return lineRef.data.features ? lineRef.data.features[0] : []
                })
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
                .then(tdc => {
                    maddog.charts.tdc = tdc.data.features.map(f =>
                        ({ ...f, properties: { ...f.properties, color: "#" + Math.floor(Math.random() * 16777215).toString(16) } })
                    );
                    // Affichage des TDC sur la carte
                    tools.drawTDC({...tdc.data, features: maddog.charts.tdc});
                    // Affichage du multi select avec les dates des TDC
                    tools.setTdcFeatures(tdc.data.features)
                    tools.createTDCMultiSelect();
                })
        },
        drawRefLine: () => {
            if (!maddog.refLine) return;

            let layer = mviewer.getLayer("refline").layer;
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "#01bbc2",
                    width: 2
                })
            });
            // display radiales on map with EPSG:3857
            let features = new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:2154'
            }).readFeatures(maddog.refLine, {
                dataProjection: 'EPSG:2154',
                featureProjection: 'EPSG:3857'
            });
            features.forEach(f => f.setStyle(style));

            layer.getSource().clear();
            layer.getSource().addFeatures(features);
        },
        drawTDC: (featureJSON) => {
            if (_.isEmpty(featureJSON)) return;

            let layerTdc = mviewer.getLayer("tdc").layer;

            // display radiales on map with EPSG:3857
            let featuresTdc = new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:2154'
            }).readFeatures(featureJSON, {
                dataProjection: 'EPSG:2154',
                featureProjection: 'EPSG:3857'
            });
            featuresTdc.forEach(f => {
                return f.setStyle(new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: f.get("color"),
                        width: 2
                    })
                }))
            });
            layerTdc.getSource().clear();
            layerTdc.getSource().addFeatures(featuresTdc);
        },
        getRadiales: (r) => {
            console.log(">>>>>>>>>> RESULTAT DRAWLINE");
            console.log(r.responseDocument);
            // on affiche la radiale sur la carte
            let layer = mviewer.getLayer("radiales").layer;

            var style = new ol.style.Style({
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
            // on zoom sur l'extent de la radiale
            tools.zoomToExtent(layer.getSource().getExtent());

            // we call coastLineTracking now
            wps.coastLineTracking(maddog.coastLinesTrackingConfig);

            // display ref line
            tools.drawRefLine();
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
            if(document.getElementById(id)) document.getElementById(id).remove();
            
            const canvas = document.createElement("canvas");
            canvas.id = id;
            document.getElementById("tdcTabGraph").appendChild(canvas);
            var config = {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: datasets
                },
                options: {
                    responsive: true,
                    scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Profils'
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Distance (m)'
                          }
                        }
                    },
                    plugins: {
                      title: {
                            display: true,
                            text: `Evolution de la cinématique du trait de côte pour le site sélectionné`,
                            position: "bottom",
                            font: {
                                size: 15,
                                family: 'roboto',
                                weight: 'bold',
                              },
                        },
                        subtitle: {
                            display: true,
                            text: `Date de référence : ${datasets[0].label}`,
                            // color: 'blue',
                            font: {
                              size: 12,
                              family: 'tahoma',
                              weight: 'normal',
                              style: 'italic'
                            },
                            padding: {
                              bottom: 10
                            }
                          }
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
                pointRadius: 0
            };
        },
        tdcChart: (dates) => {
            let labels;
            let selected = maddog.charts.coastLines.result;
            // get dates from selection or every dates
            if (!_.isEmpty(dates)) {
                selected = selected.filter(r => dates.includes(r.date))
            };
            // get uniq labels
            labels = _.uniq(_.spread(_.union)(selected.map(s => s.data.map(d => d.radiale)))).sort();
            labels = _.sortBy(labels);
            // create one line by date
            const lines = selected.map((s, i) => {
                return {
                    ...tools.createDateLine(s, labels, "separateDist"),
                    borderColor: s.color
                }
            });
            // create chart
            tools.initNewChart(lines, labels, "tdcChart");
        }, 
        showHideMenu: (ele) => {
            ele.hidden = !ele.hidden;
            selectWPS.hidden = !selectWPS.hidden;
        },
        setTdcFeatures: (features) => {
            const tdcGeojson = `<![CDATA[{"type":"FeatureCollection","features":[${JSON.stringify(features)}]}]]>`;
            maddog.setCoastLinesTrackingConfig({
                tdc: tdcGeojson
            });
            $("#drawRadialBtn").prop('disabled', features.length < 2);
        },
        onDatesChange: () => {
            let selected = [];
            // clean graph
            if (document.getElementById("tdcChart")) {
                tdcChart.remove();    
            }
            // get checked TDC
            $('#tdcMultiselect option:selected').each((i, el) => {
                selected.push(maddog.charts.tdc.filter(feature => feature.properties.creationdate === $(el).val()));
            });
            // create coastline tracking param
            tools.setTdcFeatures(selected);
        },
        createTDCMultiSelect: () => {
            // get dates from WPS coastlinetracking result
            //const dates = maddog.charts.coastLines.result.map(d => d.date);
            const dates = maddog.charts.tdc.map(d => d.properties.creationdate);
            // clean multi select if exists
            $(selector).empty()
            // create multiselect HTML parent
            let multiSelectComp = document.createElement("select");
            multiSelectComp.id = "tdcMultiselect";
            multiSelectComp.setAttribute("multiple", "multiple");
            selector.appendChild(multiSelectComp);
            // create multiselect
            $("#tdcMultiselect").multiselect({
                enableFiltering: true,
                filterBehavior: 'value',
                nonSelectedText: 'Rechercher une date',
                templates: {
                    li: `
                        <li>
                            <a class="labelDateLine">
                                <label style="display:inline;padding-right: 5px;"></label>
                                <i class="dateLine fas fa-minus"></i>
                            </a>
                        </li>`
                },
                onChange: () => {
                    tools.onDatesChange();
                },
            });
            // create options with multiselect dataprovider
            let datesOptions = dates.map((d, i) => 
                ({label: moment(d).format("DD/MM/YYYY"), value: d})
            );
            // insert options into multiselect
            $("#tdcMultiselect").multiselect('dataprovider', datesOptions);
            // change picto color according to chart and legend
            $("#selector").find(".labelDateLine").each((i, x) => {
                $(x).find(".dateLine").css("color", maddog.charts.tdc[i].properties.color);
            });
            $("#tdcMultiselect").multiselect("selectAll", false);
        },
        tdcReset: () => {
            if (document.getElementById("tdcChart")) {
                tdcChart.remove();    
            }
            $("#tdcMultiselect").multiselect("refresh");
            $('.tdcNavTabs a[href="#tdcTabDate"]').tab('show');

        }
    }
})();