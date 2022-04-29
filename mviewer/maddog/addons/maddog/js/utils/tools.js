const tools = (function () {
    const eventName = "tools-componentLoaded";
    var create = new Event(eventName);
    document.addEventListener(eventName, () => console.log("Tools lib loaded !"))
    document.dispatchEvent(create);

    const defaultClickedStyle = new ol.style.Style({
        fill: new ol.style.Fill({
            color: 'rgba(255, 255, 255, 0)',
        }),
        stroke: new ol.style.Stroke({
            color: 'rgba(55, 52, 79)',
            width: 1.4,
        })
    });

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
        ),
        initButton: (buttonId, action) => {
            document.getElementById(buttonId).onclick = action;
        },
        initEmpriseClickCtrl: (layerId, style = defaultClickedStyle) => {
            
            mviewer.getMap().on('singleclick', function (evt) {
                document.getElementById("siteName").innerHTML = "Aucun site sélectionné !";
                const viewResolution = /** @type {number} */ (mviewer.getMap().getView().getResolution());
                const url = mviewer.getLayer("sitebuffer").layer.getSource().getFeatureInfoUrl(
                    evt.coordinate,
                    viewResolution,
                    'EPSG:3857',
                    { 'INFO_FORMAT': 'application/json' }
                );
                if (url) {
                  axios.get(url)
                      .then((response) => response.data.features ? response.data.features[0] : [])
                      .then((feature) => {
                            document.getElementById("siteName").innerHTML = feature.properties.idsite;
                            tools.getReferenceLine(feature.properties.idsite);
                      })
                }
              });

        },
        getReferenceLine: (idsite) => {
            const lineRefUrl = 'https://gis.jdev.fr/geoserver/maddog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog%3Alineref&outputFormat=application%2Fjson&CQL_FILTER=idsite=';
            axios.get(`${lineRefUrl}'${idsite}'`)
                .then(lineRef => lineRef.data.features ? lineRef.data.features[0] : [])
                .then(feature => `<![CDATA[{"type":"FeatureCollection","features":[${JSON.stringify(feature)}]}]]>`)
                .then(geojson => maddog.setDrawRadialConfig({ referenceLine: geojson }))
                .then(() => tools.getTDCByIdSite(idsite));
        },
        getTDCByIdSite: (idsite) => {
            const tdcUrl = "https://gis.jdev.fr/geoserver/maddog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog:tdc&outputFormat=application/json&CQL_FILTER=idsite=";
            axios.get(`${tdcUrl}'${idsite}'`)
                .then(tdc => tdc.data.features ? tdc.data.features : [])
                .then(features => `<![CDATA[{"type":"FeatureCollection","features":[${JSON.stringify(features)}]}]]>`)
                .then(tdcGeojson => maddog.setCoastLinesTrackingConfig({tdc: tdcGeojson, referenceLine: maddog.drawRadialConfig.referenceLine}))
                .then(() => wps.coastLineTracking(maddog.coastLinesTrackingConfig))
        },
        addRadiales: (r) => {
            let layer = mviewer.getLayer("radiales").layer;

            var style = new ol.style.Style({
                fill: new ol.style.Fill({color:"red"}),
                stroke: new ol.style.Stroke({color: "black", width: 2})
            });

            // save with EPSG:2154 for getDistance WPS
            maddog.radiales2154 = new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:2154'
            }).readFeatures(r.executeResponse.responseDocument);
            
            // display radiales on map with EPSG:3857
            let features = new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:2154'
            }).readFeatures(r.executeResponse.responseDocument, {
                dataProjection: 'EPSG:2154',
                featureProjection: 'EPSG:3857'
            });

            features.forEach(f => f.setStyle(style));
            
            layer.getSource().clear();
            layer.getSource().addFeatures(features);

            tools.zoomToExtent(layer.getSource().getExtent());
        },
        getCoastLineTracking: (r) => {
            let layer = mviewer.getLayer("radiales").layer;

            var style = new ol.style.Style({
                fill: new ol.style.Fill({color:"red"}),
                stroke: new ol.style.Stroke({color: "black", width: 2})
            });
            
            let features = new ol.format.GeoJSON({
                defaultDataProjection: 'EPSG:2154'
            }).readFeatures(r.executeResponse.responseDocument, {
                dataProjection: 'EPSG:2154',
                featureProjection: 'EPSG:3857'
            });

            features.forEach(f => f.setStyle(style));
            
            layer.getSource().clear();
            layer.getSource().addFeatures(features);

            tools.zoomToExtent(layer.getSource().getExtent());
        }
    }
})();