
let legend = { items: [] };
const format = 'image/png';
var untiled = new ol.layer.Image({
    source: new ol.source.ImageWMS({
        ratio: 1,
        url: `${mviewer.env?.url_geoserver}/${mviewer.env?.geoserver_workspace}/wms`,
        params: {
            'FORMAT': format,
            'VERSION': '1.1.1',  
            "STYLES": '',
            "LAYERS": 'MADDOG:mnt',
            "exceptions": 'application/vnd.ogc.se_inimage',
        },
        operation: function (pixel, data) {
            console.log(pixel);
            console.log(data);
        }
    }),
  });

new CustomLayer("mnt", untiled, null);