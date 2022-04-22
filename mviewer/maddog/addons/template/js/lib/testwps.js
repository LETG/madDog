

    var _executeWPS = function(feature) {
        _feature = feature;
        var wpsIdentifier = "coa:drawRadial";
        //var lineString = feature.getGeometry().getCoordinates().join(" ");
        var xml = ['<?xml version="1.0" encoding="UTF-8"?><wps:Execute version="1.0.0" service="WPS" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns="http://www.opengis.net/wps/1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:wps="http://www.opengis.net/wps/1.0.0" xmlns:ows="http://www.opengis.net/ows/1.1" xmlns:gml="http://www.opengis.net/gml" xmlns:ogc="http://www.opengis.net/ogc" xmlns:wcs="http://www.opengis.net/wcs/1.1.1" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wps/1.0.0 http://schemas.opengis.net/wps/1.0.0/wpsAll.xsd">
        <ows:Identifier>coa:drawRadial</ows:Identifier>
        <wps:DataInputs>
          <wps:Input>
            <ows:Identifier>referenceLine</ows:Identifier>
            <wps:Data>
              <wps:ComplexData mimeType="application/json"><![CDATA[{
      "type": "FeatureCollection",
      "name": "ref1",
      "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
      "features": [
      { "type": "Feature", "properties": { "id": "1", "x": "152059.7779", "y": "6863515.198", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 152059.777899999986403, 6863515.197999999858439 ] } },
      { "type": "Feature", "properties": { "id": "2", "x": "152063.7083", "y": "6863506.068", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 152063.7083, 6863506.068 ] } },
      { "type": "Feature", "properties": { "id": "3", "x": "152063.9357", "y": "6863488.96", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 152063.9357, 6863488.96 ] } },
      { "type": "Feature", "properties": { "id": "4", "x": "152057.5771", "y": "6863467.537", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 152057.5771, 6863467.536999999545515 ] } },
      { "type": "Feature", "properties": { "id": "5", "x": "152045.7074", "y": "6863439.607", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 152045.707400000013877, 6863439.606999999843538 ] } },
      { "type": "Feature", "properties": { "id": "6", "x": "152019.9777", "y": "6863407.949", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 152019.977699999988545, 6863407.949 ] } },
      { "type": "Feature", "properties": { "id": "7", "x": "151959.6231", "y": "6863358.466", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 151959.6231, 6863358.466 ] } },
      { "type": "Feature", "properties": { "id": "8", "x": "151885.0617", "y": "6863317.661", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 151885.0617, 6863317.661000000312924 ] } },
      { "type": "Feature", "properties": { "id": "9", "x": "151791.9543", "y": "6863278.433", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 151791.954300000012154, 6863278.433000000193715 ] } },
      { "type": "Feature", "properties": { "id": "10", "x": "151670.1483", "y": "6863220.874", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 151670.1483, 6863220.873999999836087 ] } },
      { "type": "Feature", "properties": { "id": "11", "x": "151617.0797", "y": "6863189.891", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 151617.0797, 6863189.890999999828637 ] } },
      { "type": "Feature", "properties": { "id": "12", "x": "151568.1792", "y": "6863144.599", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 151568.179200000013225, 6863144.599000000394881 ] } },
      { "type": "Feature", "properties": { "id": "13", "x": "151497.3646", "y": "6863036.668", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 151497.3646, 6863036.667999999597669 ] } },
      { "type": "Feature", "properties": { "id": "14", "x": "151393.3409", "y": "6862881.891", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 151393.340900000010151, 6862881.890999999828637 ] } },
      { "type": "Feature", "properties": { "id": "15", "x": "151305.2707", "y": "6862758.394", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 151305.2707, 6862758.394000000320375 ] } },
      { "type": "Feature", "properties": { "id": "16", "x": "151227.4553", "y": "6862667.65", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 151227.4553, 6862667.650000000372529 ] } },
      { "type": "Feature", "properties": { "id": "17", "x": "151118.1207", "y": "6862562.882", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 151118.1207, 6862562.882000000216067 ] } },
      { "type": "Feature", "properties": { "id": "18", "x": "150981.7434", "y": "6862468.323", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 150981.7434, 6862468.322999999858439 ] } },
      { "type": "Feature", "properties": { "id": "19", "x": "150877.0335", "y": "6862406.345", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 150877.0335, 6862406.34499999973923 ] } },
      { "type": "Feature", "properties": { "id": "20", "x": "150812.3509", "y": "6862351.186", "z": "", "identifiant": "", "date": "" }, "geometry": { "type": "Point", "coordinates": [ 150812.3509, 6862351.185999999754131 ] } }
      ]
      }]]></wps:ComplexData>
            </wps:Data>
          </wps:Input>
          <wps:Input>
            <ows:Identifier>radialLength</ows:Identifier>
            <wps:Data>
              <wps:LiteralData>100</wps:LiteralData>
            </wps:Data>
          </wps:Input>
          <wps:Input>
            <ows:Identifier>radialDistance</ows:Identifier>
            <wps:Data>
              <wps:LiteralData>50</wps:LiteralData>
            </wps:Data>
          </wps:Input>
          <wps:Input>
            <ows:Identifier>radialDirection</ows:Identifier>
            <wps:Data>
              <wps:LiteralData>-1</wps:LiteralData>
            </wps:Data>
          </wps:Input>
        </wps:DataInputs>
        <wps:ResponseForm>
          <wps:RawDataOutput mimeType="text/xml; subtype=wfs-collection/1.0">
            <ows:Identifier>resulFeatureCollection</ows:Identifier>
          </wps:RawDataOutput>
        </wps:ResponseForm>
      </wps:Execute>'
        ].join('');

        $.ajax({
            type: "POST",
            url: mviewer.ajaxURL("https://geobretagne.fr/wps/mnt"),
            data: xml,
            contentType: "text/xml",
            dataType: "xml",
            success: _updateChart,
            error: function(xhr, ajaxOptions, thrownError) {
                mviewer.alert("Problème avec la requête.\n" + thrownError, "alert-info");
                $("#loading-profile").hide();
            }
        });
        
    };

    