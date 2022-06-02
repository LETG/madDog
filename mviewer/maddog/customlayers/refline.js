
let stylePrive = [new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'rgba(99, 110, 114,0.0)',
        width: 1
    })
})];

let legend = { items: [] };

let layer = new ol.layer.Vector({
    source: new ol.source.Vector({
            format: new ol.format.GeoJSON()
        }),
        style: function(feature, resolution) {
            return stylePrive;
        }
});

new CustomLayer("refline", layer, legend);