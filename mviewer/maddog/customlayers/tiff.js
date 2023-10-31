
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

mviewer.getMap().once('postrender', () => {
    proj4.defs(
        'EPSG:2154',
        '+proj=lcc +lat_0=46.5 +lon_0=3 +lat_1=49 +lat_2=44 +x_0=700000 +y_0=6600000 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs +type=crs'
    );
    ol.proj.proj4.register(proj4);
})
const source = new ol.source.GeoTIFF({
    //wrapX: true,
    normalize: false,
    sources: [
      {
        nodata: 0,
        url: 'https://gis.jdev.fr/mviewer/apps/maddog/data/vectorize2.tiff',
      },
    ],
  });
let layer = new ol.layer.WebGLTile({
    source: source
});
console.log("CREATE TIFF");
new CustomLayer("tiff", layer);