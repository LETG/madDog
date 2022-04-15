const wfs2Fuse = (function () {
    const options = {
        includeScore: true
    }
    const prepare = (url, o) => 
        axios.get(url)
            .then(({ data }) => {
                wfs2Fuse.motor = new Fuse(
                    data.features.map(d => d.properties),
                    { ...options, ...o }
                );
            })
            .catch(e => console.log(e));
    return {
        initSearch: (url, o) => {
            if (!axios) {
                new Promise((resolve) => document.addEventListener(`axios-componentLoaded`, resolve()))
                    .then(v => prepare(url, o));
            }
            return prepare(url, o);
        },
        search: (t) => new Promise((resolve) => {
            return resolve(wfs2Fuse.motor.search(t));
        }),
        motor: null
    };

})();

new CustomComponent("wfs2Fuse", null);