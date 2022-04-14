#!/bin/bash

echo ">START PROCESS"
vrt="$1"
table="$2"
layerName="$3"
fileName="$4"
output="$5"

format="GEOJson"

# DB infos
host=""
port=5432
user=""
schema="vougot"
password=""
db=""

if [ -z $table ] || [ -z $vrt ]
then
    echo "-!-ARGS MISSING : table, vrt -> tableName fileName.vrt"
    echo "-!-IMPORT FAIL"
    echo ">END PROCESS"
    exit 1
fi

if [ ! -z $output ]
# create geojson from vrt
then 
    echo ">CREATE GEOJSON FROM VRT"
    ogr2ogr -f "$format" $output $vrt
fi

tempVrt="$table.vrt"
cp -pr $vrt $tempVrt
echo "$tempVrt"
sed -i "s/LAYERNAME/$layerName/g" "$tempVrt"
sed -i "s/FILENAME/$fileName/g" "$tempVrt"

# insert into postgis table
echo ">OVERWRITE AND INSERT TO TABLE -> '$schema'.'$table'"
ogr2ogr -overwrite -f "PostgreSQL" PG:"host='$host' user='$user' dbname='$db' password='$password' schemas='$schema'" $tempVrt --config SCHEMA='$schema' PG_USE_COPY=YES -lco GEOMETRY_NAME=geom -nln "$table"

echo ">CLEAN TEMPORARY VRT FILE"
rm $tempVrt
echo ">IMPORT SUCCESS"
echo ">END PROCESS"