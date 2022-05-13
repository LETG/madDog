const prfUtils = (function() {
    const eventName = "tools-componentLoaded";
    var create = new Event(eventName);
    document.addEventListener(eventName, () => console.log("PRF Utils lib loaded !"))
    document.dispatchEvent(create);

    return {
        getPrfRefLines: (idsite) => {
            // On cherche les lignes de référence des profiles
            // Permettant ensuite de filter les profils a afficher
            const lineRefUrl = 'https://gis.jdev.fr/geoserver/maddog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog:prf&outputFormat=application%2Fjson&CQL_FILTER=idsite=';
            axios.get(`${lineRefUrl}'${idsite}'`)
                .then(prfRefLine => {
                    maddog.prfRefLine = prfRefLine.data;
                    return prfRefLine.data.features ? prfRefLine.data.features[0] : []
                })
                .then(feature => `<![CDATA[{"type":"FeatureCollection","features":[${JSON.stringify(feature)}]}]]>`)
                // On affiche les lignes de références de profils pour selection
                .then(() => prfUtils.drawPrfRefLines());
        },
        getDistance: (latlng1, latlng2) => {
            var line = new ol.geom.LineString([latlng1, latlng2]);
            return Math.round(line.getLength() * 100) / 100;
        },
        getPrfByProfilAndIdSite: (idSite, idType) => {
            // on récupère ensuite les profils correspondant à l'idSite et au profil selectionné
            const prfUrl = "https://gis.jdev.fr/geoserver/maddog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog:prf&outputFormat=application/json&CQL_FILTER=idsite=";
            axios.get(`${prfUrl}'${idSite}' AND idtype='${idType}'`)
                // récupération du PRF
                .then(prf => {

                    // get ref point (first by default)
                    const newFeatures = prf.data.features.map(p => {
                        let refPoint = null;
                        const points = p.geometry.coordinates.map((line, order) => {
                            if (!order) {
                                refPoint = [...line, 0];
                                return [...line, 0];
                            }
                            return [...line, prfUtils.getDistance([line[0],line[1]], [refPoint[0],refPoint[1]])]
                        });
                        return {
                            ...p,
                            properties: {
                                ...p.properties,
                                color: "#" + Math.floor(Math.random() * 16777215).toString(16),
                                points: points
                            }
                        };
                    });
                    maddog.charts.beachProfile = {
                        ...prf.data,
                        features: newFeatures
                    };
                    // Affichage du multi select avec les dates des PRF
                    prfUtils.setPrfFeatures(prf.data.features)
                    prfUtils.createPrfMultiSelect();
                    // Affichage des Profils sur la carte
                    prfUtils.changePrf()
                })
        },
        drawPrfRefLines: () => {
            if (!maddog.prfRefLine) return;

            let layer = mviewer.getLayer("refline").layer;
            var style = new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: "black",
                    width: 2
                })
            });
            // display radiales on map with EPSG:3857
            let features = new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:2154'
            }).readFeatures(maddog.prfRefLine, {
                dataProjection: 'EPSG:2154',
                featureProjection: 'EPSG:3857'
            });
            features.forEach(f => f.setStyle(style));

            layer.getSource().clear();
            layer.getSource().addFeatures(features);
        },
        createPlotlyLine: (dataDate, labels, field, color) => {
            const line = {
                name: moment(dataDate.date).format("DD/MM/YYYY"),
                x: labels,
                type: "scatter",
                mode: 'lines',
                line: {
                    color: color
                },
                width: 3
            };
            // sort by radiale name for each date
            if (!dataDate.data.length) {
                // create reference line with 0 values for each labels
                line.y = labels.map(() => 0);
                line.line = {
                    ...line.line,
                    dash: 'dashdot',
                    width: 4
                };
            } else {
                line.y = labels.map((radialeName, i) => {
                    const radialeValues = _.find(dataDate.data, ["radiale", radialeName])
                    return _.isEmpty(radialeValues) ? null : _.get(radialeValues, field);
                });
            }
            return line;
        },
        prfBilanSedChart: (dates) => {
            let labels;
            let selected = maddog.charts.sediments.result;
            $("#prfBilanSedChart").remove();
            const div = document.createElement("div");
            div.id = "prfBilanSedChart";
            document.getElementById("ppTabGraph").appendChild(div);

            // get dates from selection or every dates
            if (!_.isEmpty(dates)) {
                selected = selected.filter(r => dates.includes(r.date))
            };
            // get uniq labels
            labels = _.uniq(_.spread(_.union)(selected.map(s => s.data.map(d => d.radiale)))).sort();
            labels = _.sortBy(labels);
            // create one line by date
            const lines = selected.map((s, i) => {
                return prfUtils.createPlotlyLine(s, labels, "separateDist", s.color)
            });
            // create chart
            const axesFont = {
                font: {
                    family: 'Roboto',
                    size: 14,
                    color: '#7f7f7f'
                }
            }
            Plotly.newPlot('prfBilanSedChart', lines, {
                showlegend: false,
                title: {
                    text: `Date de référence : ${maddog.sedimentsReference}`,
                    font: {
                        family: 'Roboto',
                        size: 16
                    },
                    y: 0.9
                },
                xaxis: {
                    title: {
                        standoff: 40,
                        text: 'Distance',
                        pad: 2,
                        ...axesFont,
                    },
                    showgrid: false,
                    dtick: 5,
                },
                //TODO deux yaxis un bar pour evolution n-1 un ligne pour evolution cumulée
                yaxis: {
                    gridcolor: "#afa8a7",
                    title: {
                        text: 'Evolution cumulée (m)',
                        ...axesFont
                    },
                    dtick: 2,
                }
            }, {
                responsive: true,
                modeBarButtonsToAdd: [{
                    name: 'Export SVG',
                    icon: {
                        width: 500,
                        height: 600,
                        path: "M384 128h-128V0L384 128zM256 160H384v304c0 26.51-21.49 48-48 48h-288C21.49 512 0 490.5 0 464v-416C0 21.49 21.49 0 48 0H224l.0039 128C224 145.7 238.3 160 256 160zM255 295L216 334.1V232c0-13.25-10.75-24-24-24S168 218.8 168 232v102.1L128.1 295C124.3 290.3 118.2 288 112 288S99.72 290.3 95.03 295c-9.375 9.375-9.375 24.56 0 33.94l80 80c9.375 9.375 24.56 9.375 33.94 0l80-80c9.375-9.375 9.375-24.56 0-33.94S264.4 285.7 255 295z"
                    },
                    click: function(gd) {
                        Plotly.downloadImage(gd, {
                            format: 'svg'
                        })
                    }
                }, {
                    name: 'Export CSV',
                    icon: {
                        width: 500,
                        height: 600,
                        path: "M224 0V128C224 145.7 238.3 160 256 160H384V448C384 483.3 355.3 512 320 512H64C28.65 512 0 483.3 0 448V64C0 28.65 28.65 0 64 0H224zM80 224C57.91 224 40 241.9 40 264V344C40 366.1 57.91 384 80 384H96C118.1 384 136 366.1 136 344V336C136 327.2 128.8 320 120 320C111.2 320 104 327.2 104 336V344C104 348.4 100.4 352 96 352H80C75.58 352 72 348.4 72 344V264C72 259.6 75.58 256 80 256H96C100.4 256 104 259.6 104 264V272C104 280.8 111.2 288 120 288C128.8 288 136 280.8 136 272V264C136 241.9 118.1 224 96 224H80zM175.4 310.6L200.8 325.1C205.2 327.7 208 332.5 208 337.6C208 345.6 201.6 352 193.6 352H168C159.2 352 152 359.2 152 368C152 376.8 159.2 384 168 384H193.6C219.2 384 240 363.2 240 337.6C240 320.1 231.1 305.6 216.6 297.4L191.2 282.9C186.8 280.3 184 275.5 184 270.4C184 262.4 190.4 256 198.4 256H216C224.8 256 232 248.8 232 240C232 231.2 224.8 224 216 224H198.4C172.8 224 152 244.8 152 270.4C152 287 160.9 302.4 175.4 310.6zM280 240C280 231.2 272.8 224 264 224C255.2 224 248 231.2 248 240V271.6C248 306.3 258.3 340.3 277.6 369.2L282.7 376.9C285.7 381.3 290.6 384 296 384C301.4 384 306.3 381.3 309.3 376.9L314.4 369.2C333.7 340.3 344 306.3 344 271.6V240C344 231.2 336.8 224 328 224C319.2 224 312 231.2 312 240V271.6C312 294.6 306.5 317.2 296 337.5C285.5 317.2 280 294.6 280 271.6V240zM256 0L384 128H256V0z"
                    },
                    click: function(gd) {
                        // TODO : csv export from WPS response or selected dates
                        tools.downloadBlob(maddog.sedimentsCSV, 'exportSediments.csv', 'text/csv;charset=utf-8;')
                    }
                }]

            });
        },
        prfChart: (dates) => {
            let labels;
            let selected = maddog.charts.beachProfile.features;
            $("#pofilesDatesChart").remove();
            const div = document.createElement("div");
            div.id = "pofilesDatesChart";
            document.getElementById("pofilesDates").appendChild(div);

            // get dates from selection or every dates
            if (!_.isEmpty(dates)) {
                selected = selected.filter(r => dates.includes(r.properties.creationdate))
            };
            // get uniq labels
            labels = _.uniq(_.spread(_.union)(selected.map(s => s.data.map(d => d.distance)))).sort();
            labels = _.sortBy(labels);
            // create one line by date
            const lines = selected.map((s, i) => {
                return prfUtils.createPlotlyLine(s, labels, s.color)
            });
            // create chart
            const axesFont = {
                font: {
                    family: 'Roboto',
                    size: 14,
                    color: '#7f7f7f'
                }
            }
            Plotly.newPlot('prfBilanSedChart', lines, {
                showlegend: false,
                title: {
                    text: `Date de référence : ${maddog.sedimentsReference}`,
                    font: {
                        family: 'Roboto',
                        size: 16
                    },
                    y: 0.9
                },
                xaxis: {
                    title: {
                        standoff: 40,
                        text: 'Distance',
                        pad: 2,
                        ...axesFont,
                    },
                    showgrid: false,
                    dtick: 5,
                },
                //TODO deux yaxis un bar pour evolution n-1 un ligne pour evolution cumulée
                yaxis: {
                    gridcolor: "#afa8a7",
                    title: {
                        text: 'Evolution cumulée (m)',
                        ...axesFont
                    },
                    dtick: 2,
                }
            }, {
                responsive: true,
                modeBarButtonsToAdd: [{
                    name: 'Export SVG',
                    icon: {
                        width: 500,
                        height: 600,
                        path: "M384 128h-128V0L384 128zM256 160H384v304c0 26.51-21.49 48-48 48h-288C21.49 512 0 490.5 0 464v-416C0 21.49 21.49 0 48 0H224l.0039 128C224 145.7 238.3 160 256 160zM255 295L216 334.1V232c0-13.25-10.75-24-24-24S168 218.8 168 232v102.1L128.1 295C124.3 290.3 118.2 288 112 288S99.72 290.3 95.03 295c-9.375 9.375-9.375 24.56 0 33.94l80 80c9.375 9.375 24.56 9.375 33.94 0l80-80c9.375-9.375 9.375-24.56 0-33.94S264.4 285.7 255 295z"
                    },
                    click: function(gd) {
                        Plotly.downloadImage(gd, {
                            format: 'svg'
                        })
                    }
                }, {
                    name: 'Export CSV',
                    icon: {
                        width: 500,
                        height: 600,
                        path: "M224 0V128C224 145.7 238.3 160 256 160H384V448C384 483.3 355.3 512 320 512H64C28.65 512 0 483.3 0 448V64C0 28.65 28.65 0 64 0H224zM80 224C57.91 224 40 241.9 40 264V344C40 366.1 57.91 384 80 384H96C118.1 384 136 366.1 136 344V336C136 327.2 128.8 320 120 320C111.2 320 104 327.2 104 336V344C104 348.4 100.4 352 96 352H80C75.58 352 72 348.4 72 344V264C72 259.6 75.58 256 80 256H96C100.4 256 104 259.6 104 264V272C104 280.8 111.2 288 120 288C128.8 288 136 280.8 136 272V264C136 241.9 118.1 224 96 224H80zM175.4 310.6L200.8 325.1C205.2 327.7 208 332.5 208 337.6C208 345.6 201.6 352 193.6 352H168C159.2 352 152 359.2 152 368C152 376.8 159.2 384 168 384H193.6C219.2 384 240 363.2 240 337.6C240 320.1 231.1 305.6 216.6 297.4L191.2 282.9C186.8 280.3 184 275.5 184 270.4C184 262.4 190.4 256 198.4 256H216C224.8 256 232 248.8 232 240C232 231.2 224.8 224 216 224H198.4C172.8 224 152 244.8 152 270.4C152 287 160.9 302.4 175.4 310.6zM280 240C280 231.2 272.8 224 264 224C255.2 224 248 231.2 248 240V271.6C248 306.3 258.3 340.3 277.6 369.2L282.7 376.9C285.7 381.3 290.6 384 296 384C301.4 384 306.3 381.3 309.3 376.9L314.4 369.2C333.7 340.3 344 306.3 344 271.6V240C344 231.2 336.8 224 328 224C319.2 224 312 231.2 312 240V271.6C312 294.6 306.5 317.2 296 337.5C285.5 317.2 280 294.6 280 271.6V240zM256 0L384 128H256V0z"
                    },
                    click: function(gd) {
                        // TODO : csv export from WPS response or selected dates
                        tools.downloadBlob(maddog.prfCSV, 'exportProfiles.csv', 'text/csv;charset=utf-8;')
                    }
                }]

            });
        },
        setPrfFeatures: (features) => {
            const prfGeojson = `<![CDATA[{"type":"FeatureCollection","features":[${JSON.stringify(features)}]}]]>`;
            maddog.setBeachProfileTrackingConfig({
                fc: prfGeojson
            });
            $("#prftrackingBtn").prop('disabled', features.length < 2);
        },
        changePrf: () => {
            let selected = [];
            // clean graph
            if (document.getElementById("prfBilanSedChart")) {
                prfBilanSedChart.remove();
            }
            if (document.getElementById("pofilesDatesChart")) {
                $("#pofilesDates").empty();
            }
            // get checked PRF
            $('#prfMultiselect option:selected').each((i, el) => {
                selected.push(maddog.charts.beachProfile.features.filter(feature => feature.properties.creationdate === $(el).val())[0]);
            });
            // create beach profile tracking param
            prfUtils.setPrfFeatures(selected);
            if (maddog.charts.beachProfile && maddog.charts.beachProfile.features.length) {
                let csv = _.flatten(maddog.charts.beachProfile.features.map(x => x.properties));
                // check CSV
                maddog.prfCSV = Papa.unparse(csv);
            }

            // set legend content
            const legendHtml = selected.map(s => {
                let color = "color:" + s.properties.color;
                return `<li>
                    <a class="labelDateLine">
                        <label style="display:inline;padding-right: 5px;">${moment(s.properties.creationdate).format("DD/MM/YYYY")}</label>
                        <i class="fas fa-minus" style='${color}'></i>
                    </a>
                </li>`
            }).join("");
            prfUtils.changeLegend($(`<p>Date(s) sélectionnée(s):</p><ul class="nobullet">${legendHtml}</ul>`));
        },
        changeLegend: (content) => {
            panelDrag?.display();
            panelDrag?.clean();
            panelDrag?.change(content);
        },
        manageError: () => {
            const displayError = $('#prfMultiselect option:selected').length < 2;
            // manage trigger wps button
            $("#prftrackingBtn").prop("disabled", displayError);
            panelPrfParam.hidden = displayError;
            alertPrfParams.hidden = !displayError;
        },
        createPrfMultiSelect: () => {
            const dates = maddog.charts.beachProfile.features.map(d => d.properties.creationdate);
            // clean multi select if exists
            $(selectorPrf).empty()
            // create multiselect HTML parent
            let multiSelectComp = document.createElement("select");
            multiSelectComp.id = "prfMultiselect";
            multiSelectComp.setAttribute("multiple", "multiple");
            selectorPrf.appendChild(multiSelectComp);
            // create multiselect
            $("#prfMultiselect").multiselect({
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
                    prfUtils.changePrf();
                    prfUtils.manageError();
                },
            });
            // create options with multiselect dataprovider
            let datesOptions = dates.map((d, i) =>
                ({
                    label: moment(d).format("DD/MM/YYYY"),
                    value: d
                })
            );
            // insert options into multiselect
            $("#prfMultiselect").multiselect('dataprovider', datesOptions);
            // change picto color according to chart and legend
            $("#selectorPrf").find(".labelDateLine").each((i, x) => {
                $(x).find(".dateLine").css("color", maddog.charts.beachProfile.features[i].properties.color);
            });
            $("#prfMultiselect").multiselect("selectAll", false);

            prfUtils.manageError();
        },
        prfReset: (cleanPrfLayer) => {
            if (document.getElementById("prfBilanSedChart")) {
                prfBilanSedChart.remove();
            }
            $("#prfMultiselect").multiselect("refresh");
            $('.prfNavTabs a[href="#prfTabDate"]').tab('show');
            mviewer.getLayer("refline").layer.getSource().clear();
            panelDrag.clean();
            panelDrag.hidden();
            if (!cleanPrfLayer) {
                // TODO get idType frome PRF selection
               prfUtils.getPrfByProfilAndIdSite(maddog.idsite, "PRF1");
            }
        },
        initPrf: () => {
            prfUtils.prfReset();
        },
        onParamChange: (e) => {
            //TODO create a config for beach profile
        }
    }
})();