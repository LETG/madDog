const maddog = (function () {
    let typingTimer; //timer identifier
    let zoomFeatureExtent = null;
    const doneTypingInterval = 500;  //time in ms, 5 second for example
    const GEOJSON = new ol.format.GeoJSON();

    let wpsService = null;

    document.addEventListener("map-ready", () => tools.onClickAction("sitebuffer"));

    document.addEventListener("communes-ready", () => {
        const defaultZoomOptions = maddog.getCfg("config.options.defaultLayerZoom");
        if (defaultZoomOptions && !_.isEmpty(defaultZoomOptions)) {
            tools.zoomToWMSLayerExtent(defaultZoomOptions.layer, defaultZoomOptions.workspace, defaultZoomOptions.asHomeExtent);
        }
    });

    const waitLib = (name, ready) => new Promise((resolve, reject) => {
        if (!ready) {
            document.addEventListener(name, resolve(true));
        } else {resolve(true)}
    });

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

    const onInput = (e) => {
        //user is "finished typing," do something
        function doneTyping () {
            return displayAutocompleteList(e);
        }
        //on input, clear the countdown 
        $(e.target).on('input', function () {
            clearTimeout(typingTimer);
            typingTimer=setTimeout(doneTyping, doneTypingInterval);
        });
    };

    const onHover = (i) => {
        const type = i.target.getAttribute("type");
        const idField = maddog.getCfg(`config.options.${type}.idField`);
        const featureId = i.target.getAttribute("value");
        let feature = maddog[type].features.filter(f => f.properties[idField].toString() === featureId.toString())[0];
        feature = GEOJSON.readFeature(feature);
        tools.featureToOverlay(feature);
        zoomFeatureExtent = feature.getGeometry().getExtent();
    }

    const onSelect = (i) => {
        tools.zoomToExtent(zoomFeatureExtent);
        const type = i.target.getAttribute("type");
        if (type === "sites") {
            tools.setIdSite(i.target.getAttribute("value"), i.target.innerHTML);
            tools.initServicebyMenu();
        }
    };

    const displayAutocompleteList = (inputEvt) => {
        const value = inputEvt.target.value;
        maddog.searchComm(value).then(communesResult => maddog.searchSite(value).then(sitesResult => {
            const communesLabel = maddog.getCfg("config.options.communes.label");
            const sitesLabel = maddog.getCfg("config.options.sites.label");
            const html = [
                '<span id="test-autocomplete">',
                ...createList(communesResult, maddog.getCfg("config.options.communes.idField"), communesLabel,  'Communes', 'communes'),
                ...createList(sitesResult, maddog.getCfg("config.options.sites.idField"), sitesLabel, 'Sites', 'sites'),
                '</span>'
            ];
            maddog.autocomplete.display(html.join(""), onSelect, onHover );
        }));
    }

    return {
        searchComm: (t) => typeof wfs2Fuse != "undefined" ? wfs2Fuse.search(t, "communes") : "",
        searchSite: (t) => typeof wfs2Fuse != "undefined" ? wfs2Fuse.search(t, "sites") : "",
        getCfg: (i) => _.get(mviewer.customComponents.maddog, i),
        init: function () {
            // wait all plugin as required dependancies
            let waitAll = [
                waitLib(`tools-componentLoaded`, typeof tools !== 'undefined'),
                waitLib(`axios-componentLoaded`, typeof axios !== 'undefined'),
                waitLib(`wfs2Fuse-componentLoaded`, typeof wfs2Fuse !== 'undefined'),
                waitLib(`maddog-wps-componentLoaded`, typeof wps !== 'undefined'),
                waitLib(`bootstrap-multiselect-componentLoaded`, true)
            ];
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
                wpsService = wps.createWpsService(
                    {
                        ...maddog.getCfg("config.options.wps")
                    }
                );
                maddog.setDrawRadialConfig({
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
                });
                maddog.setCoastLinesTrackingConfig({
                    wpsService: wpsService,
                    responseFormat: "raw",
                    executionMode: "async",
                    lineage: false,
                    radiales: {},
                    tdc: {},
                    processIdentifier: "coa:coastLinesTracking",
                    callback: (response) => {
                        tdcLoader.hidden = true;
                        maddog.charts.coastLines = JSON.parse(response.responseDocument);
                        maddog.charts.coastLines.result = maddog.charts.coastLines.result.map(
                            r => {
                                const color = _.find(maddog.charts.tdc.features, ["properties.creationdate", r.date + "Z"])?.properties?.color;
                                return { ...r, color: color };
                            }
                        );
                        let csv = _.flatten(maddog.charts.coastLines.result.filter(c => c.data.length).map(x => x.data.map(z => ({...z, date: x.date}))));
                        maddog.tdcCSV = Papa.unparse(csv);
                        maddog.tdcReference = moment.min(maddog.charts.coastLines.result.map(d => moment(d.date))).format("DD/MM/YYYY");
                        tdcUtils.tdcPlotyChart();
                    }
                });
                maddog.setBeachProfileTrackingConfig({
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
                        $('.ppNavTabs a[href="#ppTabGraph"]').tab('show');
                        maddog.charts.sediments = JSON.parse(response.responseDocument);
                        let csv = _.flatten(maddog.charts.sediments.result.filter(c => c.data.length).map(x => x.data.map(z => ({...z, date: x.date}))));
                        maddog.sedimentsCSV = Papa.unparse(csv);
                        // prfUtils.sedimentsPlotyChart();
                    }
                });
            });
        },
        setDrawRadialConfig: (param) => {
            if (!maddog.drawRadialConfig) {
                maddog.drawRadialConfig = {};
            }
            maddog.drawRadialConfig = { ...maddog.drawRadialConfig, ...param };
        },
        drawRadialConfig: {},
        coastLinesTrackingConfig: {},
        beachProfileTrackingConfig: {},
        setCoastLinesTrackingConfig: (param) => {
            if (!maddog.coastLinesTrackingConfig) {
                maddog.coastLinesTrackingConfig = {};
            }
            maddog.coastLinesTrackingConfig = { ...maddog.coastLinesTrackingConfig, ...param };
        },
        setBeachProfileTrackingConfig: (param) => {
            if (!maddog.beachProfileTrackingConfig) {
                maddog.beachProfileTrackingConfig = {};
            }
            maddog.beachProfileTrackingConfig = { ...maddog.beachProfileTrackingConfig, ...param };
        },
        radiales2154: [],
        charts: {},
        server: mviewer.customComponents.maddog.config.options?.server,
        bbox: []
    };

})();

new CustomComponent("maddog", maddog.init);
