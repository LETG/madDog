const prfUtils = (function () {
    // PRIVATE
    // This allow to display a browser console message when this file is correctly loaded
    const eventName = "prfUtils-componentLoaded";
    var create = new Event(eventName);
    document.addEventListener(eventName, () => console.log("PRF Utils lib loaded !"));
    // required and waiting by maddog.js PromisesAll
    document.dispatchEvent(create);

    return {
        /**
         * Get PRF Ref Lines from WFS URL
         * @param {String} idsite 
         */
        getPrfRefLines: (idsite) => {
            // On cherche les lignes de référence des profiles
            // Permettant ensuite de filter les profils a afficher sur la carte et dans la liste de sélection
            const lineRefUrl = maddog.server + '/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog%3Alineref&outputFormat=application%2Fjson&CQL_FILTER=idsite=';
            axios.get(`${lineRefUrl}'${idsite}' AND idtype LIKE 'PRF%25'`)
                .then(prfRefLine => {
                    maddog.prfRefLine = prfRefLine.data;
                    return prfRefLine.data.features;
                })
                .then(prfSelect => {
                    prfSelect = maddog.prfRefLine.features;
                    var elMainSelect = document.getElementById('selectProfil');

                    function optionsGenerator(value, text) {
                        const elOption = document.createElement('option');
                        elOption.text = value || text;
                        elOption.value = value;
                        elMainSelect.appendChild(elOption);
                    };
                    // List empty
                    document.getElementById("selectProfil").innerHTML = "";
                    if (!prfSelect.length) {
                        // hide list
                        document.getElementById('ppTabselect').style.display = "none";
                        throw "Aucun profil n'est disponible pour ce site";
                    } else {
                        // show list
                        document.getElementById('ppTabselect').style.display = "block";
                        // first option is null
                        optionsGenerator("", "Sélectionner un profil");
                        // add other options by profile
                        prfSelect.forEach(feature => optionsGenerator(feature.properties.idtype));
                    }
                })
                // Add profile line in map
                .then(features => {
                    prfUtils.drawPrfRefLines();
                }).catch(e => prfUtils.manageError(e, "<i class='fas fa-eye-slash'></i>"));

        },
        // Manage display profile selected
        onSelectLr: (id) => {
            prfUtils.prfReset();
            if (!id) {
                return tools.resetSelectedLR();
            }
            prfUtils.getPrfByProfilAndIdSite(id);
            let feature = mviewer.getLayer("refline").layer.getSource().getFeatures().filter(f => f.get("idtype") === id)[0];
            feature.setStyle(prfUtils.profilsStyle(feature, maddog.getCfg("config.options.select.prf"), true));
            tools.setSelectedLR(feature);
        },
        /**
         * Calculate distance from 2 points
         * @param {Array} latlng1
         * @param {Array} latlng2
         * @returns <Number>
         */
        getDistance: (latlng1, latlng2) => {
            var line = new ol.geom.LineString([latlng1, latlng2]);
            return Math.round(line.getLength() * 100) / 100;
        },
        /**
         * From entry, get map and WPS data
         * @param {String} idSite 
         * @param {String} idType 
         */
        getPrfByProfilAndIdSite: (idType) => {
            // on récupère ensuite les profils correspondant à l'idSite et au profil selectionné
            const prfUrl = maddog.server + "/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog:prf&outputFormat=application/json&CQL_FILTER=idsite=";
            axios.get(`${prfUrl}'${maddog.idsite}' AND idtype='${idType}'`)
                // récupération du PRF
                .then(prf => {
                    if (!prf.data.features.length) {
                        throw new Error(`Données non disponibles pour le profil ${idType.toUpperCase()}`);
                    };
                    // get ref point (first by default)
                    const newFeatures = prf.data.features.map(p => {
                        let refPoint = null;
                        const points = p.geometry.coordinates.map((line, order) => {
                            if (!order) {
                                refPoint = [...line, 0];
                                return [...line, 0];
                            }
                            return [...line, prfUtils.getDistance([line[0], line[1]], [refPoint[0], refPoint[1]])]
                        });
                        return {
                            ...p,
                            properties: {
                                ...p.properties,
                                color: "#" + Math.floor(Math.random() * 16777215).toString(16),
                                points: points,
                                elevation: p.geometry.coordinates[2]
                            }
                        };
                    });
                    maddog.charts.beachProfile = {
                        ...prf.data,
                        features: newFeatures
                    };
                    // Création du multi select avec les dates des PRF
                    prfUtils.setPrfFeatures(prf.data.features)
                    prfUtils.createPrfMultiSelect();
                    // affichage du multiselect et boutons
                    prfToolbar.hidden = false;
                    // Affichage des Profils sur la carte
                    prfUtils.changePrf();
                })
                .catch(e => {
                    prfUtils.manageError(e, "<i class='fas fa-times-circle'></i>");
                });
        },
        /**
         * Create style for a given feature
         * @param {ol.feature} feature
         * @returns 
         */
        profilsStyle: (feature, color, hover) => {
            let last = feature.getGeometry().getCoordinates()[0];
            let first = feature.getGeometry().getCoordinates()[1];
            return (f, res) => {
                const displayLabel = res < mviewer.getLayer("sitebuffer").layer.getMinResolution();
                const labels = displayLabel ? new ol.style.Text({
                    font: hover ? '20px Roboto' : '18px Roboto',
                    text: `${f.get('idtype')}`,
                    placement: 'point',
                    rotation: -Math.atan((last[1] - first[1]) / (last[0] - first[0])),
                    textAlign: 'center',
                    offsetY: 3,
                    textBaseline: "bottom",
                    fill: new ol.style.Fill({
                        color: color || 'black'
                    })
                }) : null;
                return tools.refLineStyle(labels, color);
            }
        },
        /**
         * Draw ref line
         * @returns null if not necessary
         */
        drawPrfRefLines: () => {
            if (!maddog.prfRefLine) return;

            let layer = mviewer.getLayer("refline").layer;
            // display radiales on map with EPSG:3857
            let features = new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:2154'
            }).readFeatures(maddog.prfRefLine, {
                dataProjection: 'EPSG:2154',
                featureProjection: 'EPSG:3857'
            });
            features.forEach(f => f.setStyle(prfUtils.profilsStyle(f)));

            layer.getSource().clear();
            layer.getSource().addFeatures(features);
        },
        /**
         * Create Poltly line
         * @param {Array} data 
         * @returns 
         */
        createPlotlyLine: (data) => {
            const line = {
                name: data.name,
                x: data.x,
                y: data.y,
                type: "scatter",
                mode: 'lines',
                line: {
                    color: data.color || "#13344b"
                },
                width: 3
            };
            return line;
        },
        /**
         * Create Poltly line
         * @param {Array} data 
         * @returns 
         */
        createPlotlyBar: (data) => {
            const line = {
                name: data.name,
                x: data.x,
                y: data.y,
                type: "bar",
                width: 3
            };
            return line;
        },
        /**
         * Order Array objects by date
         * @param {Array} selected
         * @returns ordered array
         */
        orderDatesOld: (selected) => {
            return selected.sort((a, b) => {
                return moment(a.isodate).diff(b.isodate);
            });
        },
        orderDates: (selected) => {
            return _.orderBy(selected, (o) => {
                return moment(o.isodate);
            }, ['asc'])
        },
        /**
         * Create second tab Chart from WPS result
         */
        prfBilanSedChart: () => {
            const profile = maddog.charts.beachProfile.features[0].properties.idtype;
            // clean previous chart
            $("#prfBilanSedChart").remove();
            const div = document.createElement("div");
            div.id = "prfBilanSedChart";
            document.getElementById("ppTabGraph").appendChild(div);
            // standardize date format
            let selected = maddog.charts.sediments.result.map(item => ({
                ...item,
                isodate: new Date(item.date)
            }));
            selected = prfUtils.orderDates(selected, "isodate");
            // get uniq labels already orderd by date
            const datesX = _.uniq(selected.map(s => new Date(moment(s.date, "YYYY-MM-DDZ"))));
            var data = [{
                    x: datesX,
                    y: selected.map(s => s.data.filter(i => i.totalEvolutionPercent)[0]?.totalEvolutionPercent),
                    name: "Evolution cumulée"
                },
                {
                    x: datesX,
                    y: selected.map(s => s.data.filter(i => i.previousEvolutionPercent)[0]?.previousEvolutionPercent),
                    type: "bar",
                    name: "Evolution de date à date"
                }
            ];
            const axesFont = {
                font: {
                    family: 'Roboto',
                    size: 14,
                    color: '#7f7f7f'
                }
            };
            var layout = {
                autosize: true,
                showlegend: true,
                legend: {
                    x: 1,
                    xanchor: 'right',
                    y: 1
                },
                title: {
                    text: `Evolution du bilan sédimentaire de la plage pour le profil ${profile}`,
                    font: {
                        family: 'Roboto',
                        size: 15
                    },
                    y: 0.9
                },
                xaxis: {
                    type: 'date',
                    autorange: true,
                    tickfont: {
                        color: "rgb(107, 107, 107)",
                        size: 11
                    },
                    ticks: "outside",
                    tickwidth: 1,
                    tickangle: 40,
                    ticklen: 5,
                    showticklabels: true,
                    showline: true,
                    showgrid: false
                },
                yaxis: {
                    ticktext: selected.map(s => s.data.filter(i => i.totalEvolutionPercent)[0]?.totalEvolutionPercent),
                    autorange: true,
                    showgrid: false,
                    zeroline: false,
                    autotick: true,
                    ticks: 'outside',
                    gridcolor: "#afa8a7",
                    showticklabels: true,
                    showline: false,
                    title: {
                        text: 'Bilan séd. (m3/m.l.)',
                        ...axesFont
                    }
                }
            };
            Plotly.newPlot(
                'prfBilanSedChart',
                data,
                layout, {
                    scrollZoom: true,
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

                }
            )
        },
        /**
         * Create first tab Chart from selected profile
         * @param {Array} features ol.feature<Array>
         */
        prfChart: (features) => {
            const profile = maddog.charts.beachProfile.features[0].properties.idtype;
            let selected = features || maddog.charts.beachProfile.features;
            $("#pofilesDatesChart").remove();
            const div = document.createElement("div");
            div.id = "pofilesDatesChart";
            document.getElementById("pofilesDates").appendChild(div);

            // get uniq labels
            const preparedLinesData = selected.map(s => {
                return {
                    ...s.properties,
                    x: s.properties.points.map(x => x[3]),
                    y: s.properties.points.map(x => x[2]),
                    name: `${s.id}-${s.properties.idtype}`
                }
            });
            // create one line by date
            const lines = preparedLinesData.map((s, i) => {
                return prfUtils.createPlotlyLine(s)
            });
            // create chart
            const axesFont = {
                font: {
                    family: 'Roboto',
                    size: 14,
                    color: '#7f7f7f'
                }
            }
            Plotly.newPlot('pofilesDatesChart', lines, {
                showlegend: false,
                autosize: true,
                title: {
                    text: `Variations du profil transversal de la plage ${profile.toUpperCase()}`,
                    font: {
                        family: 'Roboto',
                        size: 16
                    },
                    y: 0.9
                },
                xaxis: {
                    title: {
                        standoff: 40,
                        text: 'Distance (en m)',
                        pad: 2,
                        ...axesFont,
                    },
                    showgrid: true
                },
                yaxis: {
                    gridcolor: "#afa8a7",
                    title: {
                        text: 'Hauteur (en m - NGF IGN 69)',
                        ...axesFont
                    },
                    dtick: 2,
                    showgrid: true
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
                        tools.downloadBlob(maddog.prfCSV, 'exportProfiles.csv', 'text/csv;charset=utf-8;')
                    }
                }]

            });
        },
        /**
         * From Request we create new PRF input according to WPS
         * @param {Array} features <Aray>
         */
        setPrfFeatures: (features) => {
            const crsInfo = `
                "crs": {
                    "type": "name",
                    "properties": {
                        "name": "EPSG:2154"
                    }
                }
            `;
            const prfGeojson = `<![CDATA[{"type":"FeatureCollection", ${crsInfo},"features":[${JSON.stringify(features)}]}]]>`;
            maddog.setBeachProfileTrackingConfig({
                fc: prfGeojson
            });
            $("#prftrackingBtn").prop('disabled', features.length < 2);
        },
        /**
         * On change beach profile entry
         */
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
            if (!selected.length) {
                return prfUtils.changeLegend($(`<p>Aucune date n'a été sélectionnée !</p>`));
            };
            prfUtils.setPrfFeatures(selected);
            if (maddog.charts.beachProfile && maddog.charts.beachProfile.features.length) {
                let csv = _.flatten(maddog.charts.beachProfile.features.map(x => x.properties));
                // check CSV
                maddog.prfCSV = Papa.unparse(csv);
            }
            prfUtils.prfChart(selected);
            // set legend content
            const legendHtml = selected.map(s => {
                let color = "color:" + s.properties.color;
                return `<li>
                    <a class="labelDateLine">
                        <label style="display:inline;padding-right: 5px;">${moment(s.properties.creationdate, "YYYY-MM-DDZ").format("DD/MM/YYYY")}</label>
                        <i class="fas fa-minus" style='${color}'></i>
                    </a>
                </li>`
            }).join("");
            prfUtils.changeLegend($(`<p>Date(s) sélectionnée(s):</p><ul class="nobullet">${legendHtml}</ul>`));
        },
        /**
         * Update legend content
         * @param {any} content 
         */
        changeLegend: (content) => {
            panelDrag?.display();
            panelDrag?.clean();
            panelDrag?.change(content);
        },
        /**
         * Control params before allow to trigger WPS Beach Profil
         */
        manageError: (msg = '', icon = '') => {
            const displayError = $('#prfMultiselect option:selected').length < 2;
            if (msg) {
                alertPrfParams.innerHTML = `${icon} ${msg}`;
            }
            // manage trigger wps button
            $("#prftrackingBtn").prop("disabled", displayError);
            panelPrfParam.hidden = displayError;
            alertPrfParams.hidden = !displayError;
        },
        /**
         * Create bootstrap-multiselect for beach profile UI
         */
        createPrfMultiSelect: () => {
            prfToolbar.hidden = false;
            //const dates = maddog.charts.beachProfile.features.map(d => d.properties.creationdate);
            // get dates from WPS result
            let data = maddog.charts.beachProfile.features
                .map(f => f.properties)
                .map(item => ({
                    ...item,
                    isodate: new Date(moment(item.creationdate, "YYYY-MM-DDZ"))
                }));
            let dates = prfUtils.orderDates(data);
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
                    label: moment(d.creationdate, "YYYY-MM-DDZ").format("DD/MM/YYYY"),
                    value: d.creationdate
                })
            );
            // insert options into multiselect
            $("#prfMultiselect").multiselect('dataprovider', datesOptions);
            // change picto color according to chart and legend
            $("#selectorPrf").find(".labelDateLine").each((i, x) => {
                $(x).find(".dateLine").css("color", dates[i].color);
            });
            $("#prfMultiselect").multiselect("selectAll", true);
            $("#prfMultiselect").multiselect("updateButtonText");

            prfUtils.manageError("Vous devez choisir un site, un profil et au moins 2 dates !", '<i class="fas fa-exclamation-circle"></i>');
        },
        /**
         * Reset Beach Profile UI and data
         * @param {boolean} cleanPrfLayer 
         */
        prfReset: (cleanPrfLayer, msg) => {
            prfToolbar.hidden = true;
            if (document.getElementById("pofilesDatesChart")) {
                pofilesDatesChart.remove();
            }
            if (document.getElementById("prfBilanSedChart")) {
                prfBilanSedChart.remove();
            }
            if (document.getElementById("prfMultiselect")) {
                prfMultiselect.remove();
            }
            $('.ppNavTabs a[href="#ppTabDate"]').tab('show');
            panelDrag.clean();
            panelDrag.hidden();
            if (cleanPrfLayer) {
                // TODO get idType frome PRF selection
                mviewer.getLayer("refline").layer.getSource().clear();
            }
            prfUtils.manageError(msg || '<i class="fas fa-exclamation-circle"></i> Vous devez choisir un site, un profil et au moins 2 dates !');
            tools.resetSelectedLR();
        },
        /**
         * Init
         */
        initPrf: () => {
            prfUtils.prfReset();
        },
        /**
         * Change param evt
         * @param {any} e event or this html item
         */
        onParamChange: (e) => {
            //TODO create a config for beach profile
        },
        multiSelectBtn: (action) => {
            $("#prfMultiselect").multiselect(action, false);
            prfUtils.changePrf();
            prfUtils.manageError("Vous devez choisir un site, un profil et au moins 2 dates !", '<i class="fas fa-exclamation-circle"></i>');
        }
    }
})();
