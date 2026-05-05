#!/bin/bash

# read conf
. config.sh

if [ -z $maddogDBHost ] || [ -z $maddogDBPort ] || [ -z $maddogDBUser ] || [ -z $maddogDBPassword ] || [ -z $maddogDBSchema ] || [ -z $maddogDBName ]
then
    echo "DB CONNEXION INFOS MISSING please configure in config.sh -> END PROCESS "
    exit 1
fi

psql_exec(){
  # usage: psql_exec "SQL_COMMAND"         -> exécute et affiche résultat
  # or:   psql_exec -f path/to/file.sql    -> exécute un fichier SQL
  if [ -z "$maddogDBHost" ] || [ -z "$maddogDBPort" ] || [ -z "$maddogDBUser" ] || [ -z "$maddogDBPassword" ] || [ -z "$maddogDBName" ]; then
    echo "DB params missing"
    return 1
  fi

  if [ "$1" = "-f" ] && [ -n "$2" ]; then
    PGPASSWORD="$maddogDBPassword" psql -h "$maddogDBHost" -p "$maddogDBPort" -d "$maddogDBName" -U "$maddogDBUser" -t -A -f "$2"
  else
    PGPASSWORD="$maddogDBPassword" psql -h "$maddogDBHost" -p "$maddogDBPort" -d "$maddogDBName" -U "$maddogDBUser" -t -A -c "$*"
  fi
}

delete_data_file(){
    local dataFile="$1"
    local metaFile="${dataFile%.*}.meta"
    local folder
    folder=$(dirname "$dataFile")

    echo "-- Deleting data file: $dataFile and meta file: $metaFile"
    rm -f "$dataFile" "$metaFile"
    fileDeleted=true

    if [ -d "$folder" ] && [ -z "$(ls -A "$folder")" ]; then
        echo "-- Removing empty folder: $folder"
        rmdir "$folder"
    fi
}

echo "-- Get information from history table to remove survey data"
# Read history table to get data to remove ( only when to_delete = true )
# get id_survey, date_survey, id_type, code_site
historyData=$(psql_exec "SELECT hs.id_history, hs.id_survey, hs.date_survey, hs.id_measure_type, hs.id_site, p.num_profil FROM $maddogDBSchema.history hs, $maddogDBSchema.profil p WHERE hs.to_delete = true AND hs.id_survey = p.id_survey;")

surveyDeletedCount=0

# for each entry in historyData
for entry in $historyData
do
    id_history=$(echo $entry | cut -d'|' -f1)
    id_survey=$(echo $entry | cut -d'|' -f2)
    date_survey=$(echo $entry | cut -d'|' -f3)
    id_measure_type=$(echo $entry | cut -d'|' -f4)
    id_site=$(echo $entry | cut -d'|' -f5)    
    num_profil=$(echo $entry | cut -d'|' -f6)    
    type_measure=$(psql_exec "SELECT type_measure FROM $maddogDBSchema.measure_type WHERE id_measure_type = $id_measure_type;")
    code_site=$(psql_exec "SELECT code_site FROM $maddogDBSchema.site WHERE id_site = $id_site;" )
    fileDeleted=false
    
    echo "-- Processing history id: $id_history, survey id: $id_survey, measure type id: $id_measure_type, site id: $id_site"
    echo "-- Code site: $code_site, Measure type: $type_measure , num profil: $num_profil, date: $date_survey"
    # Structure case
    case $type_measure in
    "MNT")
        echo "No spatial tables for $type_measure " ;;
    "REF")
        psql_exec "DELETE FROM $maddogDBSchema.lineref WHERE ogc_fid IN (SELECT ogc_fid FROM $maddogDBSchema.lineref WHERE idsite = '$code_site' AND idtype = '$type_measure$num_profil' AND creationdate = '$date_survey' LIMIT 1);"
        echo "Delete $type_measure$num_profil values for survey $id_survey" ;;
    "TDC")
        psql_exec "DELETE FROM $maddogDBSchema.tdc WHERE ogc_fid IN (SELECT ogc_fid FROM $maddogDBSchema.tdc WHERE idsite = '$code_site' AND idtype = '$type_measure$num_profil' AND creationdate = '$date_survey' LIMIT 1);"
        echo "Delete $type_measure$num_profil values for survey $id_survey" ;;
    "PRF")
        psql_exec "DELETE FROM $maddogDBSchema.prf WHERE ogc_fid IN (SELECT ogc_fid FROM $maddogDBSchema.prf WHERE idsite = '$code_site' AND idtype = '$type_measure$num_profil' AND creationdate = '$date_survey' LIMIT 1);"
        echo "Delete $type_measure$num_profil values for survey $id_survey" ;;
    *)
        echo "Unknown type"
        exit 1 ;;
    esac

    # Delete entry in survey table( cascade delete will remove data in dependent tables )
    psql_exec DELETE FROM $maddogDBSchema.survey WHERE id_survey = $id_survey;
    surveyDeletedCount=$((surveyDeletedCount + 1))


    echo "-- Removing survey data from file system"
    ## Find folders to delete in file system using code_site, id_type, date_survey from history table
    # then read all .meta files to find files to delete ( compare date in meta with date_survey in history table )
    # then delete files and folders if empty   
    # List all subfolder from rootPath/$id_site/$type_measure$num_profil
    dataRootPath="$rootPath/$code_site/$type_measure$num_profil"
    if [ -d "$dataRootPath" ]; then
        while IFS= read -r metaFile
        do
            secondline=$(sed -n '2p' "$metaFile")
            IFS=';' read -r -a metaFields <<< $secondline
            metaIdSurvey=${metaFields[7]}

            if [ "$metaIdSurvey" = "$id_survey" ]; then
                delete_data_file "${metaFile%.*}.csv"
                break
            fi
        done < <(find "$dataRootPath" -type f -name "*.meta")

        if [ "$fileDeleted" != true ]; then
            legacyMatches=()
            while IFS= read -r metaFile
            do
                secondline=$(sed -n '2p' "$metaFile")
                IFS=';' read -r -a metaFields <<< $secondline

                metaCodeSite=${metaFields[0]}
                metaTypeMeasure=${metaFields[1]}
                metaNumProfil=${metaFields[2]}
                if [ -z "$metaNumProfil" ]; then metaNumProfil=1; fi
                metaDateSurvey=${metaFields[3]}
                metaDateSurvey=$(date -d "$metaDateSurvey" +"%Y-%m-%d" 2>/dev/null)
  
                if [ "$metaCodeSite" = "$code_site" ] && [ "$metaTypeMeasure" = "$type_measure" ] && [ "$metaDateSurvey" = "$date_survey" ] && [ "$metaNumProfil" = "$num_profil" ]; then
                    legacyMatches+=("$metaFile")
                fi
            done < <(find "$dataRootPath" -type f -name "*.meta")

            if [ ${#legacyMatches[@]} -eq 1 ]; then
                delete_data_file "${legacyMatches[0]%.*}.csv"
            elif [ ${#legacyMatches[@]} -gt 1 ]; then
                echo "-- WARNING: Multiple legacy files match survey id: $id_survey. File deletion skipped because no id_survey marker exists in metadata."
            fi
        fi
    fi


    # If fileDeleted != true add a warning
    if [ "$fileDeleted" != true ]; then
        echo "-- WARNING: No file found to delete for survey id: $id_survey, measure type: $type_measure, site code: $code_site, date: $date_survey"
    fi

    # Update state and date in history table
    echo "-- Updating history table"
    psql_exec "UPDATE  $maddogDBSchema.history set date_deleted=CURRENT_DATE, to_delete=FALSE WHERE id_survey=$id_survey"      
done


# Update materialized view
echo "-- Updating materialized views"
psql_exec "REFRESH MATERIALIZED VIEW $maddogDBSchema.sitemntdate;"
psql_exec "REFRESH MATERIALIZED VIEW $maddogDBSchema.sitemeasureprofil;"

echo "-- Surveys deleted: $surveyDeletedCount"

echo "-- END PROCESS"
