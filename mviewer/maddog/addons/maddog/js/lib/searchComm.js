const searchComm = (function () {
    const wfsComm = "https://gis.jdev.fr/geoserver/maddog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog%3Acomm3857&outputFormat=application%2Fjson"

    let fuse = null;

    const prepareFuse = (list) => {
        console.log(list);
        const options = {
            includeScore: true
        }
        console.log(list);
        const fuse = new Fuse(list, options);
    }
    
    return {
        init: () => {
            let list = [];

            if (!Fuse) {
                return;
            }
            axios.get(wfsComm)
                .then(({data}) => {
                    console.log("test");
                    if (!data?.totalFeatures) return;
                    const noms = data.features.map(d => d.properties.nom);
                    prepareFuse(noms);
                })
                .catch(error => reject([]))
        },
        search: (text) => {
            return fuse.search(text);
        }
    }

})();