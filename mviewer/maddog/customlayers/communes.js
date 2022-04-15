
let stylePrive = [new ol.style.Style({
    fill: new ol.style.Fill({
        color: 'rgba(99, 110, 114,0.2)'
    }),
    stroke: new ol.style.Stroke({
        color: "#ffffff",
        width: 1
    })
})];

let legend = { items: [] };

// legend.items.push({styles:stylePublic, label: "Public", geometry: "Point"});
// legend.items.push({styles:stylePrive, label: "Privé", geometry: "Point"});

let layer = new ol.layer.Vector({
        source: new ol.source.Vector({
            url: "apps/maddog/data/comm3857.json",
            format: new ol.format.GeoJSON()
        }),
        style: function(feature, resolution) {
            return stylePrive;
        }
});

new CustomLayer("communes", layer, legend);
