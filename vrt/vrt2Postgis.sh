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
tempType="TMP$type"
if [ $type = "MNT" ]
then
    tempType="MNT"
fi
echo ">TempType -> $tempType"
cp -pr $vrtFile $tempVrt
escapedFileName=$(echo $fileName | sed 's_/_\\/_g')

sed -i "s/LAYERNAME/$(basename ${fileName} .csv)/g" $tempVrt
sed -i "s/<SrcDataSource>/<SrcDataSource>$escapedFileName/g" $tempVrt

ogr2ogr -f "GEOJson" points.geojson $tempVrt 

ogr2ogr -append -f "PostgreSQL" PG:"host=$maddogDBHost user=$maddogDBUser port=$maddogDBPort dbname=$maddogDBName password=$maddogDBPassword schemas=$maddogDBSchema" -nln "$tempType" $tempVrt

if [[ $type == "REF" ]]
then
    echo "Import LineREF"
    ## Need to add date
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "INSERT INTO LINEREF(idSite, geom) SELECT '$idSite', ST_Makeline(wkb_geometry) FROM (SELECT wkb_geometry FROM $tempType ORDER BY linepos) as allPoints;"
    #DROP TempTable
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "DROP TABLE $tempType;"
elif [[ $type == "TDC" ]]
then
    echo "TDC"
    ## Need to add date and TDC number
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "INSERT INTO TDC(idSite, geom) SELECT '$idSite', ST_Makeline(wkb_geometry) FROM (SELECT wkb_geometry FROM $tempType ORDER BY linepos) as allPoints;"
    #DROP TempTable
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "DROP TABLE $tempType;"
elif [[ $type == "PRF" ]]
then
    echo "PRF"
    ## Need to add date and PRF number
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "INSERT INTO PRF(idSite, geom) SELECT '$idSite', ST_Makeline(wkb_geometry) FROM (SELECT wkb_geometry FROM $tempType ORDER BY linepos) as allPoints;"
    #DROP TempTable
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "DROP TABLE $tempType;"
fi

# clean temporary VRT file
rm $tempVrt
rm points.geojson

echo ">IMPORT SUCCESS"