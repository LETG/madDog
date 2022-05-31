
let styleLine = [
    new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: '#00d2ff',
            width: 4
        })
    }),
    new ol.style.Style({
        image: new ol.style.Circle({
            radius: 5,
            fill: new ol.style.Fill({
                color: '#00d2ff',
            }),
            stroke: new ol.style.Stroke({
                color: 'white',
                width: 2
            })
        }),
        geometry: function (feature) {
          // return the coordinates of the first ring of the line
          const coordinates = feature.getGeometry().getCoordinates();
          return new ol.geom.MultiPoint(coordinates);
        },
      })
];

let layer = new ol.layer.Vector({
    source: new ol.source.Vector(),
    style: function() {
        return styleLine;
    }
});

new CustomLayer("drawRefline", layer);