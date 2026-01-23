#!/bin/bash

# This script will read all data in rootPath folder
# If folder and data fit requirement data will be integrate in database and geoserver
# 
# Requirement are
# siteFolder 4 chars
# measure type folder 3 chars and 1 number
# date folder 21 number and less than date value from lastUpdateDate.lock
. config.sh
. logging.sh

dateFileName="lastUpdateDate.lock"
integratedCount=0
missingMetaCount=0
failedCount=0
failedFiles=()

# startDate used to caculate script duration
# this will also be the date set in lastUpdateDate.lock when integration finish
startDate=$(date -u +"%Y%m%d%H%M%N")

if [ ! -f $dateFileName ]; then
    log_msg INFO "Première exécution du script d'intégration des données"
else
    # read last update date in file
    lastUpdatedDate=$(head -n 1 $dateFileName)
    humanLastUpdatedDate=$(date -u -d "${lastUpdatedDate:0:8} ${lastUpdatedDate:8:2}:${lastUpdatedDate:10:2}" +"%Y-%m-%d %H:%M:%S UTC" 2>/dev/null)
    if [ -n "$humanLastUpdatedDate" ]; then
        log_msg INFO "Date du dernier traitement - $humanLastUpdatedDate"
    else
        log_msg INFO "Last updated date - $lastUpdatedDate"
    fi
fi

# set default value if not defined
lastUpdatedDate=${lastUpdatedDate:-0}

#  List all measure types for each site
function listSubSite {
    for idSubSite in $1/*  
    do   
        # second step is measureType only get 4 char folder
        if [ -d "$idSubSite" ] && [[ ${idSubSite##*/}=~^[A-Z]{3}[0-9] ]]; then
            idSubSite=${idSubSite%*/}     
            log_msg INFO "-- Traitement de ${idSubSite##*/}"
            listData $idSubSite
        fi  
    done
} 

# List all date folder for each measure type
function listData {
    for folderDate in $1/*    
    do
        # Third step is datee
        if [ -d "$folderDate" ] && [[ ${folderDate##*/}=~^[0-9]{21} ]]; then  
            log_msg INFO "--- Traitement de ${folderDate##*/}"
            # Répertoire crée avec mkdir $(date +"%Y%m%d%H%M%N")
            if [[ "${folderDate##*/}" > "$lastUpdatedDate" ]]; then
                importData $folderDate
            else
                log_msg DEBUG "--- Skip ${folderDate##*/} (older than last update)"
            fi
        fi  
    done
} 

# Import all data in date folder
function importData {
    for data in $1/*.csv    
    do
        # Control file name format to avoid unwanted files  
        if [ -f "$data" ] && [[ ${data##*/}=~^[A-Z]{6}_[A-Z]{3}[0-9]_[0-9]{8}.* ]]; then
            csvPath="$data"
            if [ ! -f "${csvPath%.*}.meta" ]; then
                missingMetaCount=$((missingMetaCount + 1))
                log_msg WARN "Meta file missing for ${csvPath##*/}"
            fi
            data=${data%*/}    
            
            #-- Integrate spatiale data used for maddog application  
            log_msg INFO "---- Import des données de ${data##*/} en base spatiale"
            log_msg DEBUG "${idSubSite##*/} $data ${idSite##*/}"
            ./vrt2Postgis.sh ${idSubSite##*/} $data ${idSite##*/}
            spatialStatus=$?

            #-- Integrate date in maddog data model (not used by application)
            log_msg INFO "---- Import des données de ${data##*/} en base attributaire"
            ./modelData2Postgres.sh $data
            modelStatus=$?

            if [ $spatialStatus -ne 0 ] || [ $modelStatus -ne 0 ]; then
                failedCount=$((failedCount + 1))
                failedFiles+=("${data##*/}")
                log_msg ERROR "Import failed for ${data##*/} (spatial=$spatialStatus, model=$modelStatus)"
            else
                integratedCount=$((integratedCount + 1))
            fi
        fi
    done
} 

# list all site folder
for idSite in $rootPath/*     
do
    # first step is idSite
    if [ -d "$idSite" ] && [[ ${idSite##*/}=~^[A-Z0-9]{6} ]]; then
        idSite=${idSite%*/}     
        log_msg INFO "------------------ Site ${idSite##*/} ---------------------------"
        listSubSite $idSite
    fi  
done


endDate=$(date -u +"%Y%m%d%H%M%N")
executionTime=$((((endDate-startDate)) / 10000000 ))
log_msg INFO "--------------------- Fin de l'intégration -----------------------"
log_msg INFO "Nombre de fichiers intégrés - $integratedCount"
log_msg INFO "Nombre de fichiers .meta manquants - $missingMetaCount"
log_msg INFO "Nombre de fichiers en erreur - $failedCount"
if [ $failedCount -gt 0 ]; then
    for failedFile in "${failedFiles[@]}"; do
        log_msg INFO "Fichier en erreur - $failedFile"
    done
fi
log_msg INFO "Temps de traitement - $(($executionTime / 3600))hrs $((($executionTime / 60) % 60))min $(($executionTime % 60))sec"

log_msg DEBUG "Mise à jour de la date de dernière mise à jour"
echo $startDate > lastUpdateDate.lock
