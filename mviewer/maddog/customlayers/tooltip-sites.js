
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
        url: "https://portail.indigeo.fr/geoserver/MADDOG/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=MADDOG%3Asitebuffer&outputFormat=application%2Fjson"
    }),
    style: function(feature, resolution) {
        return style;
    }
});

new CustomLayer("tooltip-sites", layer, legend);