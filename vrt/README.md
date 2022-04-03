## VRT

To use VRT you need to install GDAL

* On debian : 
> apt install gdal-bin


Example de commande de lancement d'un VRT permettant transformer un csv en geojson

> cd vrt && ogr2ogr -f "GEOJson" ref1.geojson csvToLine.vrt
