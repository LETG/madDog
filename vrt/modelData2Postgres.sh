#!/bin/bash

# lecture du fichier de configuration des connexions
. config.sh

echo "-START PROCESS IMPORT DATA MODEL"
fileName="$1" # csv or meta file with data
fileNameWithoutExt="${fileName%.*}"

vrtFile="COMMON/MEASURE.vrt"
configuredVrt=currentMeasure.vrt

tableMeasure="measure"

if [ -z $maddogDBHost ] || [ -z $maddogDBPort ] || [ -z $maddogDBUser ] || [ -z $maddogDBPassword ] || [ -z $maddogDBSchema ] || [ -z $maddogDBName ]
then
    echo "DB CONNEXION INFOS MISSING please configure in config.sh -> END PROCESS "
    exit 1
fi

if [ -z $fileName ]
then
    echo "-X-ARGS MISSING -> USE THIS REQUIRED ARGS ORDER :"
    echo " type (REF1|MNT1|PRF1|TDC1) codeSite sourceFileName"
    echo "-X-IMPORT FAIL -> END PROCESS"
    exit 1
fi

echo "Using file : $fileName and meta : $fileNameWithoutExt.meta"

## Add data to database
if test -f "${fileNameWithoutExt}.meta"; then
    
    # Read only second line of meta
    secondline=`sed -n '2p' ${fileNameWithoutExt}.meta`;
    IFS=';' read -r -a metaFields <<< $secondline

    # Set variables for next database import
    codeSite=${metaFields[0]}
    typeMeasure=${metaFields[1]}
    numProfil=${metaFields[2]}
    # if not set set to 1
    if [ -z "$numProfil" ]; then numProfil=1; fi
    dateSurvey=${metaFields[3]}
    epsg=${metaFields[4]}
    nameEquipment=${metaFields[5]}
    typeOperator=${metaFields[6]}

    # Check Measure Type exist else create it
    idMeasureType=`PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -AXqtc "SELECT id_measure_type FROM measure_type where type_measure='$typeMeasure';"`
    echo "--id_measure_type :  $idMeasureType"
    if [ -z "$idMeasureType" ]
    then
        idMeasureType=`PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -AXqtc "INSERT INTO measure_type (type_measure) VALUES ('$typeMeasure') RETURNING id_measure_type;"`
        echo "--id_measure_type :  $idMeasureType"
    fi
    
    # Check if site exist else create it
    idSite=`PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -AXqtc "SELECT id_site FROM site where code_site='$codeSite';"`
    echo "--idSite :  $idSite"
    if [ -z "$idSite" ]
    then
        idSite=`PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -AXqtc "INSERT INTO site (code_site) VALUES ('$codeSite') RETURNING id_site;"`
        echo "--idSite :  $idSite"
    fi

    # Check if equipement exist else create it
    idEquipment=`PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -AXqtc "SELECT id_equipment FROM equipment where name_equipment='$nameEquipment';"`
    echo "--idEquipment :  $idEquipment"
    if [ -z "$idEquipment" ]
    then
        idEquipment=`PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -AXqtc "INSERT INTO equipment (name_equipment) VALUES ('$nameEquipment') RETURNING id_equipment;"`
        echo "--idEquipment :  $idEquipment"
    fi

    # Check if operator exist else create it
    idOperator=`PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -AXqtc "SELECT id_operator FROM operator where type_operator='$typeOperator';"`
    echo "--idOperator :  $idOperator"
    if [ -z "$idOperator" ]
    then
        idOperator=`PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -AXqtc "INSERT INTO operator (type_operator) VALUES ('$typeOperator') RETURNING id_operator;"`
        echo "--idOperator :  $idOperator"
    fi

    # Create survey
    idSurvey=`PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -AXqtc "INSERT INTO survey (date_survey, id_measure_type_survey, id_site) VALUES ('$dateSurvey', '$idMeasureType', '$idSite') RETURNING id_survey;"`
    echo "--idSurvey :  $idSurvey"

    # Add profil
    `PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -AXqtc "INSERT INTO profil (id_survey, id_measure_type, num_profil) VALUES ('$idSurvey', '$idMeasureType', '$numProfil');"`
    echo "--numProfil : $num_profil"
    
    tmpData=tempDataModel.csv
    echo "add additional information in csv file"
    #check how many columns in csv ( latest column 'commentaire' is optional)
    numCols=$(head -1 $fileName | awk -F';' '{print NF}')
    if [ $numCols -eq 7 ]
    then
        sed "s/.$/;$epsg;$idEquipment;$idOperator;$idSurvey/" $fileName > $tmpData
    else
        sed "s/.$/;;$epsg;$idEquipment;$idOperator;$idSurvey/" $fileName > $tmpData
    fi
   
    echo "replace header"
    header="id;x;y;z;identifiant;date;commentaire;epsg;id_equipment;id_operator;id_survey"   
    #replace header
    sed -i "1s/.*/$header/" $tmpData

    cp -pr $vrtFile $configuredVrt
    echo "Using file : $tmpData "
    sed -i "s/LAYERNAME/$(basename ${tmpData} .csv)/g" $configuredVrt
    sed -i "s/<SrcDataSource>/<SrcDataSource>${tmpData}/g" $configuredVrt

    echo "-Import file to postgresql in table : measure"
    ogr2ogr -append -f "PostgreSQL" PG:"host=$maddogDBHost user=$maddogDBUser port=$maddogDBPort dbname=$maddogDBName password=$maddogDBPassword schemas=$maddogDBSchema" -nln "$tableMeasure" $configuredVrt

    rm $configuredVrt
    rm $tmpData

    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "REFRESH MATERIALIZED VIEW sitemntdate;"
    PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -c "REFRESH MATERIALIZED VIEW sitemeasureprofil;"

    echo "-IMPORT DATA MODEL SUCCESS"
else
    echo "-NO META DATA TO IMPORT IN DATA MODEL"
fi

