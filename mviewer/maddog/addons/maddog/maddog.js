const maddog = (function () {
    let typingTimer; //timer identifier
    const doneTypingInterval = 500;  //time in ms, 5 second for example
    const getCfg = (i) => _.get(mviewer.customComponents.maddog, i);
    const waitLib = (name, ready) => new Promise((resolve, reject) => {
        if (!ready) {
            document.addEventListener(name, resolve(true));
        } else {resolve(true)}
    });
    const GEOJSON = new ol.format.GeoJSON();
    let zoomFeatureExtent = null;

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
        const featureId = i.target.getAttribute("value");
        let feature = maddog[i.target.getAttribute("type")].features.filter(f => f.properties.id.toString() === featureId.toString())[0];
        feature = GEOJSON.readFeature(feature);
        tools.featureToOverlay(feature);
        zoomFeatureExtent = feature.getGeometry().getExtent();
    }

    const onSelect = (i) => tools.zoomToExtent(zoomFeatureExtent);
    const displayAutocompleteList = (inputEvt) => {
        const value = inputEvt.target.value;
        maddog.searchComm(value).then(communesResult => maddog.searchSite(value).then(sitesResult => {
            const html = [
                '<span id="test-autocomplete">',
                ...createList(communesResult, 'id', 'nom',  'Communes', 'communes'),
                ...createList(sitesResult, 'id', 'id', 'Sites', 'sites'),
                '</span>'
            ];
            maddog.autocomplete.display(html.join(""), onSelect, onHover );
        }));
    }

    return {
        searchComm: (t) => typeof wfs2Fuse != "undefined" ? wfs2Fuse.search(t, "communes") : "",
        searchSite: (t) => typeof wfs2Fuse != "undefined" ? wfs2Fuse.search(t, "sites") : "",
        init: function () {
            // wait all plugin as required dependancies
            let waitAll = [
                waitLib(`tools-componentLoaded`, typeof tools !== 'undefined'),
                waitLib(`axios-componentLoaded`, typeof axios !== 'undefined'),
                waitLib(`wfs2Fuse-componentLoaded`, typeof wfs2Fuse !== 'undefined'),
            ];
            Promise.all(waitAll).then(responses => {
                tools.init("maddog");
                tools.initFuseSearch("communes", maddog.searchComm);
                tools.initFuseSearch("sites", maddog.searchSite);
                maddog.autocomplete = new Autocomplete(document.getElementById('input-autocomplete'), $('.autocomplete-result'), onInput, displayAutocompleteList);
            });
        }
    };

})();

new CustomComponent("maddog", maddog.init);