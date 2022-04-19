const wfs2Fuse = (function () {
    const options = {
        includeScore: true
    }
    const getCfg = (i) => _.get(mviewer.customComponents.wfs2Fuse, i);
    const prepare = (url, o, id, resolve) => 
        axios.get(url)
            .then(({ data }) => {
                wfs2Fuse[id] = new Fuse(
                    data.features.map(d => d.properties),
                    { ...options, ...o }
                );
                return resolve(data);
            })
            .catch(e => console.log(e));
    return {
        initSearch: (url, o, id, resolve) => {
            if (typeof axios === 'undefined') {
                new Promise((resolve) => document.addEventListener(`axios-componentLoaded`, resolve()))
                    .then(v => prepare(url, o));
            }
            return prepare(url, o, id, resolve);
        },
        search: (t, id) => new Promise((resolve) => {
            return resolve(wfs2Fuse[id].search(t, {limit: getCfg("config.options.limit")}).map(el => el.item));
        }),
        motor: null
    };

})();

new CustomComponent("wfs2Fuse", null);