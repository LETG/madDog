#!/bin/bash

# This script will read all data in rootPath folder
# If folder and data fit requirement data will be integrate in database and geoserver
# 
# Requirement are
# siteFolder 4 chars
# measure type folder 3 chars and 1 number
# date folder 21 number and less than date value from lastUpdateDate.lock

rootPath="/data/MADDOG"
dateFileName="lastUpdateDate.lock"

# startDate used to caculate script duration
# this will also be the date set in lastUpdateDate.lock when integration finish
startDate=$(date -u +"%Y%m%d%H%M%N")
# read last update date in file
lastUpdatedDate=$(head -n 1 $dateFileName)
lastUpdatedDate=${lastUpdatedDate:-0}
echo "Last updated date - $lastUpdatedDate"

# for each measureType
function listSubSite {
    for idSubSite in $1/*  
    do   
        # second step is measureType only get 4 char folder
        if [ -d "$idSubSite" ] && [[ ${idSubSite##*/}=~^[A-Z]{3}[0-9] ]]; then
            idSubSite=${idSubSite%*/}     
            echo "-- Traitement de ${idSubSite##*/}"   
            listData $idSubSite
        fi  
    done
} 

function listData {
    for folderDate in $1/*    
    do
        # Third step is datee
        if [ -d "$folderDate" ] && [[ ${folderDate##*/}=~^[0-9]{21} ]]; then  
            echo "--- Traitement de ${folderDate##*/}"
            # Répertoire crée avec mkdir $(date +"%Y%m%d%H%M%N")
            if [[ "${folderDate##*/}" > "$lastUpdatedDate" ]]; then
                importData $folderDate
            fi
        fi  
    done
} 

function importData {
    for data in $1/*.csv    
    do
        if [ -f "$data" ] && [[ ${data##*/}=~^[A-Z]{6}_[A-Z]{3}[0-9]_[0-9]{8}.* ]]; then
            data=${data%*/}    
            
            #-- Integrate spatiale data used for maddog application  
            echo "---- Import des données de ${data##*/} en base spatiale"   
            echo "${idSubSite##*/} $data ${idSite##*/}"
            ./vrt2Postgis.sh ${idSubSite##*/} $data ${idSite##*/}

            #-- Integrate date in maddog data model (not used by application)
             echo "---- Import des données de ${data##*/} en base attributaire"   
            ./modelData2Postgres.sh $data
        fi
    done
} 

# list all site folder
for idSite in $rootPath/*     
do
    # first step is idSite
    if [ -d "$idSite" ] && [[ ${idSite##*/}=~^[A-Z]{6} ]]; then
        idSite=${idSite%*/}     
        echo "--------------------- ${idSite##*/} ---------------------------" 
        echo "- Traitement du site ${idSite##*/}"    
        listSubSite $idSite
    fi  
done


endDate=$(date -u +"%Y%m%d%H%M%N")
executionTime=$((((endDate-startDate)) / 10000000 ))
echo "Temps de traitement - $(($executionTime / 3600))hrs $((($executionTime / 60) % 60))min $(($executionTime % 60))sec"

echo "Mise à jour de la date de dernière mise à jour"
echo $startDate > lastUpdateDate.lock



