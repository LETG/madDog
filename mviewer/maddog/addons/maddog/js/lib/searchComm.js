const tools = (function () {
    return {
        init: () => console.log(_this),
        waitPlugin: (id, ready) => new Promise((resolve, reject) => {
            
            if (!ready) {
                document.addEventListener(`${id}-componentLoaded`, resolve(true));
            } else {resolve(true)}
        }),
        initFuseSearch : (id, onSearch) => {
            wfs2Fuse.initSearch(
                getCfg(`config.options.${id}.url`),
                getCfg(`config.options.${id}.fuseOptions`),
                id,
                (d) => {maddog[id] = d}
            ).then(t => {
                // create search func
                onSearch(t)
            });
        },

    }
})();