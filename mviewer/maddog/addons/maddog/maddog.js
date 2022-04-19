const maddog = (function () {
    let typingTimer; //timer identifier
    const doneTypingInterval = 500;  //time in ms, 5 second for example
    const getCfg = (i) => _.get(mviewer.customComponents.maddog, i);
    const waitPlugin = (id, ready) => new Promise((resolve, reject) => {
        if (!ready) {
            document.addEventListener(`${id}-componentLoaded`, resolve(true));
        } else {resolve(true)}
    });
    let result = { sites: [], communes: [] };
    const GEOJSON = new ol.format.GeoJSON();
    let zoomFeatureExtent = null;

    /**
     * Init Fuse Search by city
     * @returns 
     */
    const initSearchComm = () => {
        const commUrl = getCfg("config.options.communesJsonUrl");
        if (!commUrl) return;
        wfs2Fuse.initSearch(
            getCfg("config.options.communesJsonUrl"),
            {
                keys: ['nom'],
                threshold: 0.3,
                minMatchCharLength: 3
            },
            'communes',
            (d) => {maddog.communes = d}
        ).then(t => {
            // create search func
            maddog.searchComm = (t) => wfs2Fuse.search(t, "communes");
        });
    };
    const initSearchSite = () => {
        wfs2Fuse.initSearch(
            getCfg("config.options.siteJsonUrl"),
            {
                keys: ['id'],
                threshold: 0.3
            },
            "sites",
            (d) => {maddog.sites = d}
        ).then(t => {
            // create search func
            maddog.searchSite = (t) => wfs2Fuse.search(t, "sites");
        });
    };
    const createList = (r, attrId, attrTitle, msg, type) => {
        let listContent = [];
        if (!r.length) {
            listContent = ["Aucun résultat"];
        } else {
            listContent = r.map(g => `
                <div class="autocomplete-li">
                    <a href="#" type="${type}" value=${_.get(g, [attrId])}>${_.get(g, [attrTitle])}</a>
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
        const featureId = i.target.getAttribute("value");
        let feature = maddog[i.target.getAttribute("type")].features.filter(f => f.properties.id.toString() === featureId.toString())[0];
        feature = GEOJSON.readFeature(feature);
        maddog.displayOverlay(feature);
        zoomFeatureExtent = feature.getGeometry().getExtent();
    }

    const onSelect = (i) => {
        maddog.zoomToFeature()
    };
    const displayAutocompleteList = (inputEvt) => {
        const value = inputEvt.target.value;
        maddog.searchComm(value).then(communesResult => maddog.searchSite(value).then(sitesResult => {
            const html = [
                '<span id="test-autocomplete">',
                ...createList(communesResult, 'id', 'nom_comple',  'Communes', 'communes'),
                ...createList(sitesResult, 'id', 'id', 'Sites', 'sites'),
                '</span>'
            ];
            result = {
                communes: communesResult,
                sites: sitesResult
            };
            maddog.autocomplete.display(html.join(""), onSelect, onHover );
        }));
    }

    return {
        displayOverlay: (feature) => {
            const overlay = mviewer.getMap().getLayers().getArray().filter(l => l.get('mviewerid') === "featureoverlay")[0].getSource();
            overlay.clear();
            overlay.addFeature(feature);
        },
        zoomToFeature: (feature) => {
            // NEED REPROJECTION FOR EMPRISE !
            if (!zoomFeatureExtent) return;
            const overlay = mviewer.getMap().getLayers().getArray().filter(l => l.get('mviewerid') === "featureoverlay")[0].getSource();
            var duration = 1000;
            mviewer.getMap().getView().fit(
                zoomFeatureExtent,
                {
                    size: mviewer.getMap().getSize(),
                    padding: [0, $("#sidebar-wrapper").width(), 0, 0],
                    duration: duration
                }
            );
            setTimeout(() => overlay.clear(), duration*2);
        },
        searchComm: () => {},
        searchSite: () => {},
        init: function () {
            // wait all plugin as required dependancies
            let waitAllPlugins = [
                waitPlugin("axios", typeof axios !== 'undefined'),
                waitPlugin("wfs2Fuse", typeof wfs2Fuse !== 'undefined'),
            ];
            Promise.all(waitAllPlugins).then(responses => {
                initSearchComm();
                initSearchSite();
                maddog.autocomplete = new Autocomplete(document.getElementById('input-autocomplete'), $('.autocomplete-result'), onInput, displayAutocompleteList);
            });
        }
    };

})();

new CustomComponent("maddog", maddog.init);