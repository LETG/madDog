
let styleLine = [new ol.style.Style({
    stroke: new ol.style.Stroke({
        color: 'orange',
        width: 2
    })
})];


let layer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: function() {
        return styleLine;
    }
});

new CustomLayer("drawRefline", layer);