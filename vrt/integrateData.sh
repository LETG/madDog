#!/bin/bash

rootPath="/data/MADDOG"
dateFileName="lastUpdateDate.lock"

startDate=$(date +"%Y%m%d%H%M%N")
# read last update date in file
lastUpdatedDate=$(head -n 1 $dateFileName)
lastUpdatedDate=${lastUpdatedDate:-0}
echo "Last updated date - $lastUpdatedDate"

function listSubSite {
    for idSubSite in $1/*  
    do   
        # first step is idSite
        if [ -d "$idSubSite" ]; then
            idSubSite=${idSubSite%*/}     
            echo "-- Traitement de ${idSubSite##*/}"   
            listData $idSubSite
        fi  
    done
} 

function listData {
    for folderDate in $1/*    
    do
        # first step is idSite
        if [ -d "$folderDate" ]; then  
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
        if [ -f "$data" ]; then
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

# list all site
for idSite in $rootPath/*     
do
    # first step is idSite
    if [ -d "$idSite" ]; then
        idSite=${idSite%*/}     
        echo "--------------------- ${idSite##*/} ---------------------------" 
        echo "- Traitement du site ${idSite##*/}"    
        listSubSite $idSite
    fi  
done


endDate=$(date +"%Y%m%d%H%M%N")
executionTime=$((((endDate-startDate)) / 10000000 ))
echo "Temps de traitement - $(($executionTime / 3600))hrs $((($executionTime / 60) % 60))min $(($executionTime % 60))sec"

echo "Mise à jour de la date de dernière mise à jour"
echo $startDate > lastUpdateDate.lock



