const maddog = (function () {
    const waitPlugin = (id, ready) => new Promise((resolve, reject) => {
        if (!ready) {
            document.addEventListener(`${id}-componentLoaded`, resolve(true));
        } else {resolve(true)}
    });
    return {
        searchReady: false,
        init: function () {
            let waitAllPlugins = [
                waitPlugin("axios", typeof axios !== 'undefined'),
                waitPlugin("wfs2Fuse", typeof wfs2Fuse !== 'undefined'),
            ]
            Promise.all(waitAllPlugins).then(responses => {
                wfs2Fuse.initSearch(
                    "https://gis.jdev.fr/geoserver/maddog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog%3Acomm3857&outputFormat=application%2Fjson",
                    {
                        keys: ['nom'],
                        threshold: 0.3,
                        minMatchCharLength: 3
                    }
                )
                    .then(t => {
                        searchReady = true;
                        // test search
                        wfs2Fuse.search('lann').then(x => console.log(x));
                    });
            });
        }
    };

})();

new CustomComponent("maddog", maddog.init);