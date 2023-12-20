/**
 * This file is usefull to manage MNT panels interaction and MNT WMS layer.
 */
const mntUtils = (function() {

    const MNTLayerName = "mnt";

    // PRIVATE
    // This allow to display a browser console message when this file is correctly loaded
    const eventName = "mntUtils-componentLoaded";
    var create = new Event(eventName);
    document.addEventListener(eventName, () => console.log("MNT Utils lib loaded !"));
    // required and waiting by maddog.js PromisesAll
    document.dispatchEvent(create);
    /**
     * Get MNT WMS openLayers source
     * @returns ol.source
     */
    const mntSrc = () => mviewer.getLayer(MNTLayerName).layer.getSource();
    /**
     * Add or change MNT WMS request params like location CQL or TIME param.
     * @param {any} newParams 
     */
    const changeSourceParams = (newParams) => {
        mntSrc().updateParams({
            ...mntSrc().getParams(),
            ...newParams
        });
        mntSrc().refresh();
    };

    const vectorLayerId = "mntCompareLayer";

    // COLOR CLASS FOR RESULT COMPARE MNT LAYER
    const getDiffColor = (n) => [{
            "color": "#30123b",
            condition: () => n <= -5,
            "label": "5.0000"
        },
        {
            "color": "#455bcd",
            condition: () => n <= -4,
            "label": "4.0000"
        },
        {
            "color": "#3e9cfe",
            condition: () => n <= -3,
            "label": "3.0000"
        },
        {
            "color": "#18d7cb",
            condition: () => n <= -2,
            "label": "2.0000"
        },
        {
            "color": "#48f882",
            condition: () => n <= -1,
            "label": "1.0000"
        },
        {
            "color": "#a4fc3c",
            condition: () => n <= 0,
            "label": "0.0000"
        },
        {
            "color": "#e2dc38",
            condition: () => n <= 1,
            "label": "1.0000"
        },
        {
            "color": "#fea331",
            condition: () => n <= 2,
            "label": "2.0000"
        },
        {
            "color": "#ef5911",
            condition: () => n <= 3,
            "label": "3.0000"
        },
        {
            "color": "#c22403",
            condition: () => n <= 4,
            "label": "4.0000"
        },
        {
            "color": "#7a0403",
            condition: () => n > 4,
            "label": "> 4.0000"
        }
    ].filter((e) => e.condition())[0];

    /**
     * remove all layers with same id
     * @param {string} id 
     */
    const removeAllLayers = (id) => {
        // remove if alreadyExists
        const mntMapLayers = mntUtils.map.getLayers().getArray();
        const layerCreated = mntMapLayers.filter(x => x.get("id") == id);
        if (layerCreated.length) {
            layerCreated.forEach(l => mntUtils.map.removeLayer(l));
        }
    }
    /**
     * Create compare tiff layer
     * @returns ol.layer.vector
     */
    const createCompareLayerTiff = (src) => {
        // create new one
        const bandValue = ['band', 1];
        const layer = new ol.layer.WebGLTile({
            source: null,
            id: vectorLayerId,
            style: {
                color: [
                    'case',
                    ['==', bandValue, -0],
                    ['color', 0, 0, 0, 0],
                    ['<=', bandValue, -4],
                    ['color', 62,55,144, 1],
                    ['<=', bandValue, -3.75],
                    ['color', 64, 64, 162, 1],
                    ['<=', bandValue, -3.5],
                    ['color', 66, 73, 178, 1],
                    ['<=', bandValue, -3.25],
                    ['color', 68, 82, 193, 1],
                    ['<=', bandValue, -3],
                    ['color', 69, 91, 205, 1],
                    ['<=', bandValue, -2.75],
                    ['color', 70, 99, 217, 1],
                    ['<=', bandValue, -2.5],
                    ['color', 70, 107, 227, 1],
                    ['<=', bandValue, -2.25],
                    ['color', 71, 116, 236, 1],
                    ['<=', bandValue, -2],
                    ['color', 71, 124, 243, 1],
                    ['<=', bandValue, -1.75],
                    ['color', 70, 132, 249, 1],
                    ['<=', bandValue, -1.5],
                    ['color', 69, 140, 253, 1],
                    ['<=', bandValue, -1.25],
                    ['color', 62, 156, 254, 1],
                    ['<=', bandValue, -1],
                    ['color', 62, 156, 254, 1],
                    ['<=', bandValue, -0.75],
                    ['color', 57, 164, 252, 1],
                    ['<=', bandValue, -0.5],
                    ['color', 52, 172, 247, 1],
                    ['<=', bandValue, -0.25],
                    ['color', 46, 180, 242, 1],
                    ['<=', bandValue, 0],
                    ['color', 40, 188, 235, 1],
                    ['<=', bandValue, 0.25],
                    ['color', 35, 195, 228, 1],
                    ['<=', bandValue, 0.5],
                    ['color', 35, 195, 228, 1],
                    ['<=', bandValue, 0.75],
                    ['color', 26, 209, 211, 1],
                    ['<=', bandValue, 1],
                    ['color', 24, 215, 203, 1],
                    ['<=', bandValue, 1.25],
                    ['color', 24, 221, 194, 1],
                    ['<=', bandValue, 1.5],
                    ['color', 25, 226, 187, 1],
                    ['<=', bandValue, 1.75],
                    ['color', 28, 230, 179, 1],
                    ['<=', bandValue, 2],
                    ['color', 33, 235, 171, 1],
                    ['<=', bandValue, 2.25],
                    ['color', 41, 239, 162, 1],
                    ['<=', bandValue, 2.5],
                    ['color', 50, 242, 152, 1],
                    ['<=', bandValue, 2.75],
                    ['color', 61, 245, 141, 1],
                    ['<=', bandValue, 3],
                    ['color', 72, 248, 130, 1],
                    ['<=', bandValue, 3.25],
                    ['color', 84, 250, 120, 1],
                    ['<=', bandValue, 3.5],
                    ['color', 96, 252, 109, 1],
                    ['<=', bandValue, 3.75],
                    ['color', 109, 254, 98, 1],
                    ['<=', bandValue, 4],
                    ['color', 122, 254, 88, 1],
                    ['<=', bandValue, 4.25],
                    ['color', 134, 255, 80, 1],
                    ['<=', bandValue, 4.5],
                    ['color', 145, 255, 72, 1],
                    ['<=', bandValue, 4.75],
                    ['color', 155, 254, 64, 1],
                    ['<=', bandValue, 5],
                    ['color', 164, 252, 60, 1],
                    ['<=', bandValue, 5],
                    ['color', 0, 0, 0, 1],
                    ['color', 0, 0, 0, 0]
                ]
            }
        });
        if (src) {
            removeAllLayers(vectorLayerId);
            layer.setSource(src);
            return layer;
        }
        proj4.defs(
            'EPSG:2154',
            '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
        );
        ol.proj.proj4.register(proj4);

        let config = maddog.compareRasterMNTConfig;
        let xml = `
            <wps:Execute service="WPS" version="1.0.0" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 			  http://schemas.opengis.net/wps/1.0.0/wpsExecute_request.xsd">
                <ows:Identifier>mnt:compareMNToTiff</ows:Identifier>
                <wps:DataInputs>
                    <wps:Input>
                        <ows:Identifier>codeSite</ows:Identifier>
                        <wps:Data>
                            <wps:LiteralData>${ maddog.idsite }</wps:LiteralData>
                        </wps:Data>
                    </wps:Input>
                    <wps:Input>
                        <ows:Identifier>initDate</ows:Identifier>
                        <wps:Data>
                            <wps:LiteralData>${ config.initDate }</wps:LiteralData>
                        </wps:Data>
                    </wps:Input>
                    <wps:Input>
                        <ows:Identifier>dateToCompare</ows:Identifier>
                        <wps:Data>
                            <wps:LiteralData>${ config.dateToCompare }</wps:LiteralData>
                        </wps:Data>
                    </wps:Input>
                    <wps:Input>
                        <ows:Identifier>evaluationInterval</ows:Identifier>
                        <wps:Data>
                            <wps:LiteralData>${ config.evaluationInterval }</wps:LiteralData>
                        </wps:Data>
                    </wps:Input>
                </wps:DataInputs>
                <wps:ResponseForm>
                    <wps:RawDataOutput mimeType="image/tiff">
                        <ows:Identifier>rasterResultAsTIFF</ows:Identifier>
                    </wps:RawDataOutput>
                </wps:ResponseForm>
            </wps:Execute>
        `;
        fetch(maddog.getCfg("config.options.wps.url"), {
            method: "POST",
            body: xml,
            headers: {
                "Content-Type": "text/xml"
            }
        }).then(x => x.arrayBuffer()).then(buffer => new Blob([buffer])).then(blob => {
            return new ol.source.GeoTIFF({
                wrapX: true,
                normalize: false,
                sources: [{
                    blob: blob,
                }],
            });
        }).then(src => {
            layer.setSource(src);
            // add layer to map
            removeAllLayers(vectorLayerId);
            mntUtils.map.addLayer(layer);
        });
    };
    // PUBLIC
    return {
        // dates from postgREST table
        dates: [],
        init: () => {
            // create selector options
            mntUtils.getDates();
            mntUtils.siteChange();
            mviewer.getLayer(MNTLayerName).layer.setVisible(true);
            mntSrc().refresh();
            mntUtils.onBaseLayerChange();
            // init legend and sync on view change
            mntUtils.syncLegend();
            if (maddog.getCfg(`config.options.syncLegend`)) {
                mviewer.getMap().getView().on('change:resolution', (event) => {
                    mntUtils.syncLegend(event);
                });   
            }
        },
        /**
         * To reset MNT
         * @param {boolean} close 
         */
        mntReset: (close) => {
            const params = mntSrc().getParams();
            delete params["CQL_FILTER"];
            delete params["TIME"];
            mntUtils.removeMap();
            mntUtils.getDates();
            mntToolbar.hidden = true;
            mntUtils.features = null;

            document.getElementById("evaluationInterval").value = mntUtils.defaultParams.evaluationInterval;
            maddog.setConfig({
                ...mntUtils.defaultParams
            }, "beachProfileTrackingConfig"); // <-- see with Gaetan why beachProfilTracking

        },
        /**
         * On close MNT panel
         */
        onClose: () => {
            mntUtils.removeMap();
            mviewer.getLayer(MNTLayerName).layer.setVisible(false);
            mntSrc().refresh();
        },
        /**
         * Get dates from PostgREST api and construct select dates list.
         * Will display first date by default.
         * @returns Array
         */
        getDates: () => {
            if (!maddog.idsite) return [];
            // get all dates by idsite
            const postgrestAPI = maddog.getCfg("config.options.postgrestapi");
            const table = maddog.getCfg("config.options.mntApi.table");
            const field = maddog.getCfg("config.options.mntApi.field");
            fetch(`${postgrestAPI}/${table}?${field}=eq.${maddog.idsite}`)
                .then(response => response.text())
                .then(response => { // dates are already ordered by date type in postgresql view
                    let datesJson = JSON.parse(response);
                    if (datesJson.length) {
                        mntUtils.date = datesJson[0].date_survey;
                        // add dates to list
                        mntUtils.createMntMultiSelect(datesJson);
                        // update layer with first list value by default
                        mntUtils.updateLayer();
                    }
                    mntPanel.hidden = !datesJson.length;
                    mntNoDatesPanel.hidden = datesJson.length > 0;
                })
        },
        /**
         * get mnt source
         */
        getMNTSource: mntSrc,
        /**
         * On selecte date value change
         * @param {Object} d - from event select element 
         * @returns update WMS layer with correct id site or correct date
         */
        dateChange: (d) => {
            mntUtils.date = d?.value;
            if (!maddog.idsite || !mntUtils.date) {
                return mntUtils.mntReset();
            };
            // create CQL - use searchParametersURL API
            mntUtils.updateLayer();
        },
        /**
         * Update WMS MNT params according selected site and selected date (first by default)
         */
        updateLayer: () => {
            if (mntUtils.date) {
                mviewer.getLayer(MNTLayerName).layer.setVisible(true);
                changeSourceParams({
                    CQL_FILTER: `location like '%${maddog.idsite}%'`,
                    time: mntUtils.date
                });
            } else {
                // no date selected remove layer visibility
                mviewer.getLayer(MNTLayerName).layer.setVisible(false);
            }
        },
        /**
         * Will be trigger on site click event
         * @returns update WMS layer with correct id site or correct date
         */
        siteChange: () => {
            mntUtils.features = null;
            mntUtils.getDates();
            // change custom layer params to add CQL
            if (!maddog.idsite) return;
            mntUtils.updateLayer();
        },
        /**
         * Create and add second map to display compare result
         */
        addMap: () => {
            // change height to 50% id="map"
            // add second div with bottom 0
            mntUtils.removeMap();
            const newMap = document.createElement('div');
            newMap.id = "mntMap";
            newMap.classList.add("map")
            map.appendChild(newMap);
            map.style = "height:50%";
            mviewer.getMap().updateSize();
            // create ol map
            mntUtils.map = new ol.Map({
                target: 'mntMap',
                layers: [],
                view: mviewer.getMap().getView(),
                controls: ol.control.defaults.defaults({
                    attribution: false,
                    zoom: false,
                }),
            });
            mntUtils.syncBaseLayer();
        },
        /**
         * Trigger when user change initial mviewer map base layer
         * @param {*} e event 
         */
        onBaseLayerChange: (e) => {
            document.getElementById("basemapslist")
                .addEventListener(
                    "click",
                    (e) => mntUtils.syncBaseLayer()
                )
        },
        /**
         * To delete second MNT map
         */
        removeMap: () => {
            if (document.getElementById("mntMap")) {
                mntMap.remove();
                mntUtils.map = null;
            }
            map.style = "height:100%";
            mviewer.getMap().updateSize();
        },
        /**
         * Will catch original mviewer base layer and add it to the second result MNT map
         * @returns nothing
         */
        syncBaseLayer: () => {
            if (!mntUtils.map) {
                return;
            }
            const mntMapBaseLayer = mntUtils.map.getLayers().getArray().filter(x => x.get("id") == "compareBaseMap");
            if (mntMapBaseLayer.length && mntMapBaseLayer[0].get("blid") == mviewer.getActiveBaseLayer()) {
                // avoid action if selected is same as current
                return;
            }
            const BL = mviewer.getMap().getLayers().getArray().filter(i => i.getProperties().blid === mviewer.getActiveBaseLayer())[0].getSource();
            if (mntMapBaseLayer.length) {
                // update source
                mntMapBaseLayer[0].setSource(BL);
                mntMapBaseLayer[0].set("blid",mviewer.getActiveBaseLayer());
                return;
            }
            // create BL
            removeAllLayers("compareBaseMap");
            const activeBL = new ol.layer.Tile({
                id: "compareBaseMap",
                visible: true,
                source: BL,
                blid: mviewer.getActiveBaseLayer()
            });
            mntUtils.map.addLayer(activeBL);
        },
        // second MNT map
        map: null,
        /**
         * Trigger when use change MNT WPS advanced params
         * @param {*} e event callback
         */
        onParamChange: (e) => {
            maddog.setConfig({
                [e.id]: e.type === "number" ? parseFloat(e.value) : e.value
            }, "compareRasterMNTConfig");
            $("#mntCompareBtnTiff").show();
        },
        /**
         * Create bootstrap-multiselect for beach profile UI
         */
        createMntMultiSelect: (dates) => {
            mntToolbar.hidden = false;
            // clean multi select if exists
            $(selectorMnt).empty();
            // create multiselect HTML parent
            let multiSelectComp = document.createElement("select");
            multiSelectComp.id = "mntMultiselect";
            multiSelectComp.setAttribute("multiple", "multiple");
            selectorMnt.appendChild(multiSelectComp);
            // create multiselect
            $("#mntMultiselect").multiselect({
                enableFiltering: true,
                filterBehavior: 'value',
                allSelectedText: 'Tous',
                nonSelectedText: 'Rechercher une date',
                templates: {
                    li: `
                        <li>
                            <a class="labelDateLine">
                                <label style="display:inline;padding-right: 5px;"></label>
                            </a>
                        </li>`
                },
                onChange: () => {
                    mntUtils.changeDates();
                    mntUtils.manageError("Vous devez choisir au moins 2 dates !", '<i class="fas fa-exclamation-circle"></i>');
                },
            });
            // create options with multiselect dataprovider
            let datesOptions = dates.map((d, i) =>
                ({
                    label: moment(d.date_survey, "YYYY-MM-DDZ").format("DD/MM/YYYY"),
                    value: d.date_survey
                })
            );
            // insert options into multiselect
            $("#mntMultiselect").multiselect('dataprovider', datesOptions);
            // change picto color according to chart and legend
            $("#selectorPrf").find(".labelDateLine").each((i, x) => {
                $(x).find(".dateLine").css("color", dates[i].color);
            });
            $("#mntMultiselect").multiselect("select", dates[0]?.date_survey);
            $("#mntMultiselect").multiselect("updateButtonText");

            mntUtils.manageError("Vous devez choisir au moins 2 dates !", '<i class="fas fa-exclamation-circle"></i>');
        },
        /**
         * To display or hide alert message
         */
        manageError: () => {
            const displayError = $('#mntMultiselect option:selected').length !== 2;
            // manage trigger wps button
            mntCompareBtnTiff.disabled = displayError;

            panelMNTParam.hidden = displayError;
            // error message
            alertMntParams.hidden = !displayError;
        },
        /**
         * Trigger when user change dates into multiselect list
         */
        changeDates: () => {
            let datesSelected = $('#mntMultiselect option:selected');
            const initDate = datesSelected[0] ? moment(datesSelected[0].value, "YYYY-MM-DD").format("YYYYMMDD") : null;
            mntUtils.date = datesSelected[0]?.value;
            $("#mntMultiselect").multiselect("updateButtonText")
            maddog.setConfig({
                initDate: initDate,
                dateToCompare: datesSelected[1] ? moment(datesSelected[1]?.value, "YYYY-MM-DD").format("YYYYMMDD") : null
            }, "compareRasterMNTConfig");
            mntUtils.updateLayer();
        },
        /**
         * Trigger when user click on select or unselect all button
         * @param {string} action 
         */
        multiSelectBtn: (action) => {
            $("#mntMultiselect").multiselect(action, false);
            mntUtils.changeDates();
            mntUtils.manageError("Vous devez choisir au moins 2 dates !", '<i class="fas fa-exclamation-circle"></i>');
        },

        addToCompareLayerTiff: () => {
            if (!mntUtils.map) return;
            // remove layer if exist
            mntUtils.map.getLayers().getArray()
                .filter(lyr => lyr.getProperties().id === vectorLayerId)
                .forEach(el => mntUtils.map.removeLayer(el));
            // create layer and add points
            createCompareLayerTiff();
        },

        /**
         * Callback on WPS response
         * @param {*} response object from WPS
         */
        onWpsSuccess: (response) => {
            // create second map
            mntUtils.addMap();
            // add result to second map
            return mntUtils.addToCompareLayerTiff();
        },
        /**
         * Fire manual WPS request without WPS north 52 lib
         */
        onWpsTrigger: () => {
            // create second map
            mntUtils.addMap();
            // add result to second map
            return mntUtils.addToCompareLayerTiff();
        },
        /**
         * Will change the legend panel
         * @param {string} content 
         */
        changeLegend: (content) => {
            panelDrag?.display();
            panelDrag?.clean();
            if (content) {
                panelDrag?.change(content)
            };
        },
        /**
         * will update legend according to second resolution
         * @param {*} event 
         */
        syncLegend: (event) => {
            if (MNT_WPS.hidden) {
                panelDrag.hidden();
            } else {
                const resolution = event ? event.target.getResolution() : null;
                const src = mviewer.getLayer(MNTLayerName).layer.getSource();
                const graphicUrl = src.getLegendUrl(resolution);
                mntUtils.changeLegend($(`<div><img src="${graphicUrl}" id="legendMnt"/></div>`));
            }
        },
        defaultParams: {
            evaluationInterval: 0,
            initDate: null,
            dateToCompare: null
        }
    }
})()
