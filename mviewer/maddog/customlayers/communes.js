
let stylePrive = [new ol.style.Style({
    fill: new ol.style.Fill({
        color: 'rgba(99, 110, 114,0.0)'
    }),
    stroke: new ol.style.Stroke({
        color: 'rgba(99, 110, 114,0.0)',
        width: 1
    })
})];

let legend = { items: [] };

// legend.items.push({styles:stylePublic, label: "Public", geometry: "Point"});
// legend.items.push({styles:stylePrive, label: "Privé", geometry: "Point"});

let layer = new ol.layer.Vector({
    source: new ol.source.Vector({
            url:"https://gis.jdev.fr/geoserver/maddog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog%3Acommunes_intersect&outputFormat=application%2Fjson",
            format: new ol.format.GeoJSON()
        }),
        style: function(feature, resolution) {
            return stylePrive;
        }
});

new CustomLayer("communes", layer, legend);