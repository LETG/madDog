#!/bin/bash

echo ">START PROCESS"
vrt="$1"
table="$2"
output="$3"

format="GEOJson"

# DB infos
host=""
port=5432
user=""
schema="vougot"
password=""
db="maddog"

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

# insert into postgis table
echo ">OVERWRITE AND INSERT TO TABLE -> '$schema'.'$table'"
ogr2ogr -overwrite -f "PostgreSQL" PG:"host='$host' user='$user' dbname='$db' password='$password' schemas='$schema'" $vrt --config SCHEMA='$schema' PG_USE_COPY=YES -lco GEOMETRY_NAME=geom -nln "$table"

echo ">IMPORT SUCCESS"
echo ">END PROCESS"