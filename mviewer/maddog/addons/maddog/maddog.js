const maddog = (function() {
    let typingTimer; //timer identifier
    let zoomFeatureExtent = null;
    const doneTypingInterval = 500; //time in ms, 5 second for example
    const GEOJSON = new ol.format.GeoJSON();

    let wpsService = null;

    // wait map ready
    document.addEventListener("map-ready", () => {
        tools.onClickAction();
        tools.highlightFeature();
    });

    // wait communes layer ready
    document.addEventListener("communes-ready", () => {
        tools.zoomToOGCLayerExtent();
    });

    // wait many lib to avoid race condition errors
    const waitLib = (name, ready) => new Promise((resolve, reject) => {
        if (!ready) {
            document.addEventListener(name, resolve(true));
        } else {
            resolve(true)
        }
    });

    // create autocomplete list selector
    const createList = (r, attrId, attrTitle, msg, type) => {
        let listContent = [];
        if (!r.length) {
            listContent = ["Aucun résultat"];
        } else {
            listContent = r.map(g => `
                <div class="autocomplete-li">
                    <a href="#" type="${type}" value=${_.get(g, [attrId])}>${_.get(g, [attrTitle]).toLowerCase()}</a>
                </div>
            `);
        }
        return [
            `<div class="autocomplete-category-title"><strong>${msg}</strong></div>`,
            ...listContent
        ];
    };

    // Autocomplete list input event
    const onInput = (e) => {
        //user is "finished typing," do something
        function doneTyping() {
            return displayAutocompleteList(e);
        }
        //on input, clear the countdown 
        $(e.target).on('input', function() {
            clearTimeout(typingTimer);
            typingTimer = setTimeout(doneTyping, doneTypingInterval);
        });
    };

    /**
     * Display overlay on feature hover
     * @param {any} i return by event
     */
    const onHover = (i) => {
        const type = i.target.getAttribute("type");
        const idField = maddog.getCfg(`config.options.${type}.idField`);
        const featureId = i.target.getAttribute("value");
        let feature = maddog[type].features.filter(f => f.properties[idField].toString() === featureId.toString())[0];
        feature = GEOJSON.readFeature(feature);
        tools.featureToOverlay(feature);
        zoomFeatureExtent = feature.getGeometry().getExtent();
    };

    /**
     * On select feature callback
     * @param {*} i return by event
     */
    const onSelect = (i) => {
        tools.zoomToExtent(zoomFeatureExtent);
        const type = i.target.getAttribute("type");
        if (type === "sites") {
            tools.setIdSite(i.target.getAttribute("value"), i.target.innerHTML);
            tools.initServicebyMenu();
        }
    };

    /**
     * To create and display <options> in autocomplete list
     * @param {any} inputEvt on user input text
     */
    const displayAutocompleteList = (inputEvt) => {
        const value = inputEvt.target.value;
        maddog.searchComm(value).then(communesResult => maddog.searchSite(value).then(sitesResult => {
            const communesLabel = maddog.getCfg("config.options.communes.label");
            const sitesLabel = maddog.getCfg("config.options.sites.label");
            const html = [
                '<span id="test-autocomplete">',
                ...createList(communesResult, maddog.getCfg("config.options.communes.idField"), communesLabel, 'Communes', 'communes'),
                ...createList(sitesResult, maddog.getCfg("config.options.sites.idField"), sitesLabel, 'Sites', 'sites'),
                '</span>'
            ];
            maddog.autocomplete.display(html.join(""), onSelect, onHover);
        }));
    }

    return {
        // search commune with fuse
        searchComm: (t) => typeof wfs2Fuse != "undefined" ? wfs2Fuse.search(t, "communes") : "",
        // search site with fuse
        searchSite: (t) => typeof wfs2Fuse != "undefined" ? wfs2Fuse.search(t, "sites") : "",
        // utils func to get params from config like maddog.getcfg("options.server")
        getCfg: (i) => _.get(mviewer.customComponents.maddog, i),
        // on init
        init: function() {
            // wait all plugin as required dependancies
            let waitAll = [
                waitLib(`tools-componentLoaded`, typeof tools !== 'undefined'),
                waitLib(`axios-componentLoaded`, typeof axios !== 'undefined'),
                waitLib(`wfs2Fuse-componentLoaded`, typeof wfs2Fuse !== 'undefined'),
                waitLib(`maddog-wps-componentLoaded`, typeof wps !== 'undefined'),
                waitLib(`bootstrap-multiselect-componentLoaded`, true)
            ];
            // execute a callback only if every promises are resolved
            Promise.all(waitAll).then(responses => {
                tools.init("maddog");
                tools.initFuseSearch("communes", maddog.searchComm);
                tools.initFuseSearch("sites", maddog.searchSite);
                maddog.autocomplete = new Autocomplete(document.getElementById('input-autocomplete'), $('.autocomplete-result'), onInput, displayAutocompleteList);
                // change default wps-js response factory
                ExecuteResponse_v1_xml = ExecuteResponse_v1_xml.extend({
                    instantiate: (wpsResponse) => {
                        return wpsResponse
                    }
                });
                // create WPS service from wps-js
                wpsService = wps.createWpsService({
                    ...maddog.getCfg("config.options.wps")
                });
                // init default draw radial config
                maddog.setConfig({
                    // callback exec in WPS response
                    callback: tdcUtils.getRadiales,
                    wpsService: wpsService,
                    referenceLine: '',
                    drawReferenceLine: '',
                    radialLength: 100,
                    radialDistance: 50,
                    radialDirection: true,
                    processIdentifier: "coa:drawRadial",
                    responseFormat: "raw",
                    executionMode: "async",
                    lineage: false
                }, "drawRadialConfig");
                // init default coast line tracking config
                maddog.setConfig({
                    wpsService: wpsService,
                    responseFormat: "raw",
                    executionMode: "async",
                    lineage: false,
                    radiales: {},
                    tdc: {},
                    processIdentifier: "coa:coastLinesTracking",
                    callback: (response) => {
                        // callback exec in WPS response
                        maddog.charts.coastLines = JSON.parse(response.responseDocument);
                        maddog.charts.coastLines.result = maddog.charts.coastLines.result.map(
                            r => {
                                const color = _.find(maddog.charts.tdc.features, ["properties.creationdate", r.date + "Z"])?.properties?.color;
                                return {
                                    ...r,
                                    color: color
                                };
                            }
                        );
                        let csv = _.flatten(maddog.charts.coastLines.result.filter(c => c.data.length).map(x => x.data.map(z => ({
                            ...z,
                            date: x.date
                        }))));
                        maddog.tdcCSV = Papa.unparse(csv);
                        maddog.tdcReference = moment.min(maddog.charts.coastLines.result.map(d => moment(d.date))).format("DD/MM/YYYY");
                        tdcUtils.tdcPlotyChart();
                    }
                }, "coastLinesTrackingConfig");
                maddog.setConfig({
                    wpsService: wpsService,
                    responseFormat: "raw",
                    executionMode: "async",
                    lineage: false,
                    fc: {},
                    interval: 2,
                    useSmallestDistance: true,
                    minDist: 0,
                    maxDist: 0,
                    processIdentifier: "BeachProfile:BeachProfileTracking",
                    callback: (response) => {
                        maddog.charts.sediments = JSON.parse(response.responseDocument);
                        let csv = maddog.charts.sediments.result.map((s,i) => ({
                            date: s.date,
                            ...Object.assign({}, ...maddog.charts.sediments.result[i].data)
                        }));
                        maddog.sedimentsCSV = Papa.unparse(csv);
                        prfUtils.prfBilanSedChart();
                    }
                }, "beachProfileTrackingConfig");
                // 
                maddog.setConfig({
                    wpsService: wpsService,
                    callback: mntUtils.onWpsSuccess,
                    codeSite: maddog.idSite,
                    processIdentifier: "mnt:compareRasterMNT",
                    initDate: null,
                    dateToCompare: null,
                    evaluationInterval: 10.0
                }, "compareRasterMNTConfig")
            });
        },
        /**
         * change, add one or many config config keys for a WPS config object
         * @param {any} param initial config before change
         */
        setConfig: (param, configWps) => {
            const config = maddog[configWps];
            if (!config) {
                maddog[configWps] = {};
            }
            maddog[configWps] = {
                ...maddog[configWps],
                ...param
            };
        },
        idsite: "",
        drawRadialConfig: {},
        coastLinesTrackingConfig: {},
        compareRasterMNTConfig: {},
        beachProfileTrackingConfig: {},
        radiales2154: [],
        charts: {},
        server: mviewer.customComponents.maddog.config.options?.server,
        bbox: []
    };
})();

new CustomComponent("maddog", maddog.init);