#!/bin/bash

echo ">START PROCESS"
output="$1"
vrt="$2"
table="$3"

format="GEOJson"

# DB infos
host="127.0.0.1"
port=5432
user=""
schema=""
password=""
db=""

if [ -z $output ] || [ -z $vrt ]
then
    echo "-!-ARGS MISSING : output, vrt -> file.geojson, file.vrt"
    echo "-!-IMPORT FAIL"
    echo ">END PROCESS"
    exit 1
fi

if [ -z $table ]
then
    echo "-!-TABLE NAME IS REQUIRED"
    # split the string by . and get the first column with outpu name file
    table="${output%%.*}"
    echo ">CREATE NEW TABLE NAME FROM OUTPUT : '$table'"
fi
# create geojson from vrt
echo ">CREATE GEOJSON FROM VRT"
ogr2ogr -f "$format" $output $vrt

# insert into postgis table
echo ">OVERWRITE AND INSERT TO TABLE -> '$schema'.'$table'"
ogr2ogr -overwrite -f "PostgreSQL" PG:"host='$host' user='$user' dbname='$db' password='$password' schemas='$schema'" $output --config SCHEMA='$schema' PG_USE_COPY=YES -lco GEOMETRY_NAME=geom -nln "$table"

echo ">IMPORT SUCCESS"
echo ">END PROCESS"