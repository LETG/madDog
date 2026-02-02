
let style = [new ol.style.Style({
    fill: new ol.style.Fill({
        color: 'rgba(0,0,0,0.0)'
    }),
    stroke: new ol.style.Stroke({
        color: 'rgba(0,0,0,0.0)',
        width: 1
    })
})];

let legend = { items: [] };

let layer = new ol.layer.Vector({
    source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: `${mviewer.env?.url_geoserver}/${mviewer.env?.geoserver_workspace}/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=MADDOG%3Acommunewithsite&outputFormat=application%2Fjson`
    }),
    style: function(feature, resolution) {
        return style;
    }
});
layer.getSource().once('change', function (e) {
    if (layer.getSource().getState() === 'ready') {
        const layerReadyEvt = new Event('communes-ready');
        document.dispatchEvent(layerReadyEvt);
    }
});

new CustomLayer("tooltip-communes", layer, legend);