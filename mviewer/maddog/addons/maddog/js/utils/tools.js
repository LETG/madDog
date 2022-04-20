const tools = (function () {
    const eventName = "tools-componentLoaded";
    var create = new Event(eventName);
    document.addEventListener(eventName, () => console.log("Tools lib loaded !"))
    document.dispatchEvent(create);
    return {
        view: () => mviewer.getMap().getView(),
        setZoom: (z) => tools.view().setZoom(z),
        getZoom: () => tools.view().getZoom(),
        getMvLayerById: (id) => mviewer.getMap().getLayers().getArray().filter(l => l.get('mviewerid') === id)[0],
        zoomToExtent: (extent) => {
            // NEED REPROJECTION FOR EMPRISE !
            const overlay = tools.getMvLayerById("featureoverlay");
            const duration = 1000;
            const displayTime = 3000;
            if (!extent || !overlay) return;
            mviewer.getMap().getView().fit(
                extent,
                
                {
                    size: mviewer.getMap().getSize(),
                    padding: [100,100,100,100],
                    duration: duration
                }
            );
            setTimeout(() => overlay.getSource().clear(), displayTime);
        },
        featureToOverlay: (feature) => {
            const overlay = tools.getMvLayerById("featureoverlay").getSource();
            overlay.clear();
            overlay.addFeature(feature);
        },
        init: (component) => {
            this.getCfg = (i) => _.get(mviewer.customComponents[component], i);
        },
        /**
         * Check or wait a plugin or lib
         * @param {string} id 
         * @param {boolean} ready 
         * @returns {function}
         */
        waitPlugin: (id, ready) => new Promise((resolve, reject) => {
            
            if (!ready) {
                document.addEventListener(`${id}-componentLoaded`, resolve(true));
            } else {resolve(true)}
        }),
        /**
         * Init Fuse Search by layer
         * @returns 
         */
        initFuseSearch : (id) => wfs2Fuse.initSearch(
                getCfg(`config.options.${id}.url`),
                getCfg(`config.options.${id}.fuseOptions`),
                id,
            (d) => { maddog[id] = d }
        )}
})();