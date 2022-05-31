
let styleLine = [new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: '#00d2ff',
        width: 4
    })
})];

let layer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: function() {
        return styleLine;
    }
});

new CustomLayer("drawRefline", layer);