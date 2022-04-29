#!/bin/bash

# lecture du fichier de configuration des connexions
. config.sh

echo ">START PROCESS"
idType="${1^^}" # MNT1 | PRF1 | TDC1 | REF1
fileName="$2" # csv file with data
idSite="$3" # VOUGOT ( 6 chars )

if [ -z $maddogDBHost ] || [ -z $maddogDBPort ] || [ -z $maddogDBUser ] || [ -z $maddogDBPassword ] || [ -z $maddogDBSchema ] || [ -z $maddogDBName ]
then
    echo "DB CONNEXION INFOS MISSING please configure in config.sh -> END PROCESS "
    exit 1
fi

if [ -z $idType ] || [ -z $idSite ] || [ -z $fileName ]
then
    echo "-X-ARGS MISSING -> USE THIS REQUIRED ARGS ORDER :"
    echo " type (REF1|MNT1|PRF1|TDC1) idSite sourceFileName"
    echo "-X-IMPORT FAIL -> END PROCESS"
    exit 1
fi

# choose VRT for defined type
type=${idType:0:3}

echo ">Type -> $type"
vrtFile="$type/$type.vrt"

# update SrcDataSource
# create temporary vrt file for this layer source
configuredVrt="current.vrt"


cp -pr $vrtFile $configuredVrt
echo "Using file : $fileName"
escapedFileName=$(echo $fileName | sed 's_/_\\/_g')

sed -i "s/LAYERNAME/$(basename ${fileName} .csv)/g" $configuredVrt
sed -i "s/<SrcDataSource>/<SrcDataSource>$escapedFileName/g" $configuredVrt

#echo ">Convert file to geoJson"
#ogr2ogr -f "GEOJson" points.geojson $configuredVrt 

## Add data to database
table="TMP$type"
if [ $type = "MNT" ]
then
    table="MNT"
fi
echo ">Import file to postgresql in table : $table"
ogr2ogr -append -f "PostgreSQL" PG:"host=$maddogDBHost user=$maddogDBUser port=$maddogDBPort dbname=$maddogDBName password=$maddogDBPassword schemas=$maddogDBSchema" -nln "$table" $configuredVrt

if [[ $type == "REF" ]]
then
    echo ">Create line for point in LineREF"
    ## Need to add date
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "INSERT INTO LINEREF(idSite, geom) SELECT '$idSite', ST_Makeline(wkb_geometry) FROM (SELECT wkb_geometry FROM $table ORDER BY linePosition) as allPoints;"
    #DROP TempTable
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "DROP TABLE $table;"
    #Update site buffer and communes
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "REFRESH MATERIALIZED VIEW sitebuffer;"
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "REFRESH MATERIALIZED VIEW communewithsite;"
elif [[ $type == "TDC" ]]
then
    echo ">Create line for point in Import TDC"
    ## Need to add date and TDC number
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "INSERT INTO TDC(idSite, idType, creationDate, geom) SELECT '$idSite', '$idType', creationDate, ST_Makeline(ARRAY(SELECT wkb_geometry FROM $table ORDER BY lineposition)) FROM (SELECT creationDate FROM $table LIMIT 1) as firstDate;"
    #DROP TempTable
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "DROP TABLE $table;"
elif [[ $type == "PRF" ]]
then
    echo ">Create line for point in Import PRF"
    ## Need to add date and PRF number
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "INSERT INTO PRF(idSite, idType, creationDate, geom) SELECT '$idSite', '$idType', creationDate, ST_Makeline(ARRAY(SELECT wkb_geometry FROM $table ORDER BY lineposition)) FROM (SELECT creationDate FROM $table LIMIT 1) as firstDate;"
    #DROP TempTable
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "DROP TABLE $table;"
fi

# clean temporary VRT file
echo ">Cleanning temporary file"
rm $configuredVrt
#rm points.geojson

echo ">IMPORT SUCCESS"