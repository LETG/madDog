const wfs2Fuse = (function () {
    const options = {
        includeScore: true
    }
    const getCfg = (i) => _.get(mviewer.customComponents.wfs2Fuse, i);
    const prepare = (url, o, id, resolve) => 
        fetch(url)
            .then(r => r.json())
            .then(r => {
                let features = r?.data?.features || r?.features;
                wfs2Fuse[id] = new Fuse(
                    features.map(d => d.properties),
                    { ...options, ...o }
                );
                return resolve(r);
            })
            .catch(e => console.log(e));
    return {
        initSearch: (url, o, id, resolve) => {
            prepare(url, o, id, resolve);
        },
        search: (t, id) => new Promise((resolve) => {
            return resolve(wfs2Fuse[id].search(t, {limit: getCfg("config.options.limit")}).map(el => el.item));
        }),
        motor: null
    };

})();

new CustomComponent("wfs2Fuse", null);