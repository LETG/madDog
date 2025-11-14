#!/bin/bash

# This script will insert data from csv to database or tiff

# Read conf file
. config.sh

echo "--START PROCESS"
idType="${1^^}" # MNT1 | PRF1 | TDC1 | REF1 | META
fileName="$2" # csv or meta file with data
fileNameWithoutExt="${fileName%.*}"
codeSite="$3" # VOUGOT ( 6 chars )

if [ -z $maddogDBHost ] || [ -z $maddogDBPort ] || [ -z $maddogDBUser ] || [ -z $maddogDBPassword ] || [ -z $maddogDBSchema ] || [ -z $maddogDBName ]
then
    echo "DB CONNEXION INFOS MISSING please configure in config.sh -> END PROCESS "
    exit 1
fi

if [ -z $idType ] || [ -z $codeSite ] || [ -z $fileName ]
then
    echo "-X-ARGS MISSING -> USE THIS REQUIRED ARGS ORDER :"
    echo " type (REF1|MNT1|PRF1|TDC1) codeSite sourceFileName"
    echo "-X-IMPORT FAIL -> END PROCESS"
    exit 1
fi

# choose VRT for defined type
type=${idType:0:3}

echo "-- Type : $type and CodeSite : $codeSite"
vrtFile="$type/$type.vrt"

# update SrcDataSource
# create temporary vrt file for this layer source
configuredVrt="current.vrt"
cp -pr $vrtFile $configuredVrt
echo "-- Using file : $fileName "

escapedFileName=$(echo $fileName | sed 's_/_\\/_g')

sed -i "s/LAYERNAME/$(basename ${fileName} .csv)/g" $configuredVrt
sed -i "s/<SrcDataSource>/<SrcDataSource>$escapedFileName/g" $configuredVrt

## use temporary tables to create lines from data
table="TMP$type"
if [ $type = "MNT" ]
then
    table="MNT"
    #Add date to filename
    mntDate=$(echo $fileName | cut -d "." -f1 | cut -d "_" -f3 )
    mntGeoJson="TMP_${codeSite}_$mntDate.json"
    mntOutputTmp="TMP_${codeSite}_$mntDate.tiff"
    mntOutput="$mntDirectory/${codeSite}_$mntDate.tiff"

    echo "mnt filename : $mntOutput"
    # First step with json to filter unwanted pc point
    #ogr2ogr -f GeoJSON "$mntGeoJson" "$configuredVrt" -where "\"identifiant\" NOT LIKE 'pc%'"
    ogr2ogr -f GeoJSON "$mntGeoJson" "$configuredVrt" -where "identifiant <> 'autre'"
    # Create tiff file
    gdal_grid -zfield z -a invdist:$gdalGridIndivParm -ot Float64 -of GTiff "$mntGeoJson" "$mntOutputTmp"
    echo "-- Update value for file $mntOutput"
    # issue on imagemosaic and gdal_grid ymin and ymax are inversed
    gdalwarp $mntOutputTmp  $mntOutput

    # File has to be readeable by geoserver to index it
    chown -R tomcat:tomcat $mntOutput
   
    #update mosaic index
    curl -v -u $geoserverLogin:$geoserverMdp -XPOST $geoserverUrl -H "\"Content-type: text/plain\"" -d "\"file://$mntDirectory\"" 

    rm $mntGeoJson
    rm $mntOutputTmp
else 
    echo "-- Import file to postgresql in table : $table"
    ogr2ogr -append -f "PostgreSQL" PG:"host=$maddogDBHost user=$maddogDBUser port=$maddogDBPort dbname=$maddogDBName password=$maddogDBPassword schemas=$maddogDBSchema" -nln "$table" $configuredVrt
fi

if [[ $type == "REF" ]]
then
    echo "-- Create line for point in LineREF"
    ## Need to add date
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "INSERT INTO LINEREF(idSite, idType, geom) SELECT '$codeSite', idType, line FROM (SELECT idType, ST_Makeline(wkb_geometry ORDER BY linePosition) as line FROM $table GROUP BY idType) as allLines;"
    #DROP TempTable
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "DROP TABLE $table;"
    #Update site buffer and communes
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "REFRESH MATERIALIZED VIEW sitebuffer;"
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "REFRESH MATERIALIZED VIEW communewithsite;"
elif [[ $type == "TDC" ]]
then
    echo "-- Create line for point in Import TDC"
    ## Need to add date and TDC number
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "INSERT INTO TDC(idSite, idType, creationDate, geom) SELECT '$codeSite', '$idType', creationDate, ST_Makeline(ARRAY(SELECT wkb_geometry FROM $table ORDER BY lineposition)) FROM (SELECT creationDate FROM $table WHERE creationDate IS NOT NULL LIMIT 1) as firstDate;"
    #DROP TempTable
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "DROP TABLE $table;"
elif [[ $type == "PRF" ]]
then
    echo "-- Create line for point in Import PRF"
    ## Need to add date and PRF number
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "INSERT INTO PRF(idSite, idType, creationDate, geom) SELECT '$codeSite', '$idType', creationDate, ST_Makeline(ARRAY(SELECT wkb_geometry FROM $table ORDER BY lineposition)) FROM (SELECT creationDate FROM $table WHERE creationDate IS NOT NULL LIMIT 1) as firstDate;"
    #DROP TempTable
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "DROP TABLE $table;"
fi

# clean temporary VRT file
echo "-- Cleanning temporary file"
rm $configuredVrt

echo "-- IMPORT SUCCESS"