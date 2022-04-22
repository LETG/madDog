#!/bin/bash

# lecture du fichier de configuration des connexions
. config.sh

echo ">START PROCESS"
type="${1^^}"
fileName="$2"
idSite="$3"



if [ -z $maddogDBHost ] || [ -z $maddogDBPort ] || [ -z $maddogDBUser ] || [ -z $maddogDBPassword ] || [ -z $maddogDBSchema ] || [ -z $maddogDBName ]
then
    echo "DB CONNEXION INFOS MISSING please configure in config.sh -> END PROCESS "
    exit 1
fi

if [ -z $type ] || [ -z $idSite ] || [ -z $fileName ]
then
    echo "-X-ARGS MISSING -> USE THIS REQUIRED ARGS ORDER :"
    echo " type (REF|MNT|PRF|TDC) idSite sourceFileName"
    echo "-X-IMPORT FAIL -> END PROCESS"
    exit 1
fi

echo ">READ -> $fileName"

# choose good VRT - Uppercase for type name
echo ">Type -> $type"
vrtFile="$type/$type.vrt"

# update SrcDataSource
# create temporary vrt file for this layer source
tempVrt="current.vrt"
cp -pr $vrtFile $tempVrt
escapedFileName=$(echo $fileName | sed 's_/_\\/_g')
sed -i "s/<SrcDataSource>/<SrcDataSource>$escapedFileName/g" $tempVrt

#ogr2ogr -append -f "PostgreSQL" PG:"host='$host' user='$user' dbname='$db' password='$password' schemas='$schema'" $tempVrt --config SCHEMA='$schema' PG_USE_COPY=YES -lco GEOMETRY_NAME=geom -nln "$table"

ogr2ogr -f "GEOJson" data.geojson $tempVrt

# clean temporary VRT file

echo ">IMPORT SUCCESS"