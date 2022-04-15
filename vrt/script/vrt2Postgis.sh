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

echo ">READ -> $fileName"

if [ -z $host ] || [ -z $port ] || [ -z $user ] || [ -z $password ] || [ -z $schema ] || [ -z $db ]
then
    echo "-X-DB CONNEXION INFOS MISSING -> END PROCESS "
    exit 1
fi

if [ -z $table ] || [ -z $vrt ] || [ -z $layerName ] || [ -z $fileName ]
then
    echo "-X-ARGS MISSING -> USE THIS REQUIRED ARGS ORDER :"
    echo " table file.vrt layerName sourceFileName"
    echo "-X-IMPORT FAIL -> END PROCESS"
    exit 1
fi

if [ ! -z $output ]
# create geojson from vrt
then 
    echo ">CREATE GEOJSON FROM VRT"
    ogr2ogr -f "$format" $output $vrt
fi

# create temporary vrt file for this layer source
tempVrt="$table.vrt"
cp -pr $vrt $tempVrt
sed -i "s/LAYERNAME/$layerName/g" "$tempVrt"
sed -i "s/FILENAME/$fileName/g" "$tempVrt"

# insert into postgis table
echo ">OVERWRITE AND INSERT TO TABLE -> '$schema.$table'"
ogr2ogr -append -f "PostgreSQL" PG:"host='$host' user='$user' dbname='$db' password='$password' schemas='$schema'" $tempVrt --config SCHEMA='$schema' PG_USE_COPY=YES -lco GEOMETRY_NAME=geom -nln "$table"

# clean temporary VRT file
rm $tempVrt
echo ">IMPORT SUCCESS"