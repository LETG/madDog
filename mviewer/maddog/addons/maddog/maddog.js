const maddog = (function () {
    let typingTimer; //timer identifier
    const doneTypingInterval = 500;  //time in ms, 5 second for example
    const getCfg = (i) => _.get(mviewer.customComponents.maddog, i);
    const waitPlugin = (id, ready) => new Promise((resolve, reject) => {
        if (!ready) {
            document.addEventListener(`${id}-componentLoaded`, resolve(true));
        } else {resolve(true)}
    });

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
            'communes'
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
            "sites"
        ).then(t => {
            // create search func
            maddog.searchSite = (t) => wfs2Fuse.search(t, "sites");
        });
    };

    const createList = (r, attrId, attrTitle, attrTitleBis = "-- Aucune valeur pour ce champ !", msg) => {
        let listContent = [];
        if (!r.length) {
            listContent = ["Aucun résultat"];
        } else {
            listContent = r.map(g => `
                <div class="autocomplete-li">
                    <a href="#" onclick=''>${_.get(g, [attrTitle]) || _.get(g, [attrTitleBis])}</a>
                </div>
            `)
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

    const displayAutocompleteList = (inputEvt) => {
        const value = inputEvt.target.value;
        maddog.searchComm(value).then(placeResult => maddog.searchSite(value).then(sitesResult => {
            const html = [
                ...createList(placeResult, 'id', 'nom_comple', 'nom', 'Communes'),
                ...createList(sitesResult, 'id', 'id','', 'Sites')
            ];
            maddog.autocomplete.display(html.join(""));
        }));
    }
    return {
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
                console.log("initAutocomplete");
                maddog.autocomplete = new Autocomplete(document.getElementById('input-autocomplete'), $('.autocomplete-result'), onInput, displayAutocompleteList);
            });
        }
    };

})();

new CustomComponent("maddog", maddog.init);