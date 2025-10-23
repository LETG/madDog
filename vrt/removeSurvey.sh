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

echo "-- Get information from history table to remove survey data"
# Read history table to get data to remove ( only when to_delete = true )
# get id_survey, date_survey, id_type, code_site
historyData=$(psql_exec "SELECT hs.id_history, hs.id_survey, hs.date_survey, hs.id_measure_type, hs.id_site FROM $maddogDBSchema.history hs WHERE hs.to_delete = true;")

# for each entry in historyData
for entry in $historyData
do
    id_history=$(echo $entry | cut -d'|' -f1)
    id_survey=$(echo $entry | cut -d'|' -f2)
    date_survey=$(echo $entry | cut -d'|' -f3)
    id_measure_type=$(echo $entry | cut -d'|' -f4)
    id_site=$(echo $entry | cut -d'|' -f5)    
    echo "-- Processing history id: $id_history, survey id: $id_survey, date: $date_survey, measure type id: $id_measure_type, site id: $id_site"
    type_measure=$(psql_exec "SELECT type_measure FROM $maddogDBSchema.measure_type WHERE id_measure_type = $id_measure_type;")
    code_site=$(psql_exec "SELECT code_site FROM $maddogDBSchema.site WHERE id_site = $id_site;" )
    echo "-- Measure type: $type_measure, code site: $code_site"        

    # Structure case
    case $type_measure in
    "MNT"|"REF")
        # we don't delete mnt or ref data so update history to set to_delete = false for these types
        psql_exec "UPDATE $maddogDBSchema.history SET to_delete = false WHERE id_history = $id_history;"
        echo "Update history no deletion for $type_measure" ;;
    "TDC")
        psql_exec "DELETE FROM $maddogDBSchema.tdc WHERE idsite = $id_site AND idtype = $id_measure_type AND creationdate = $date_survey;"
        echo "Delete $type_measure values for this survey $id_survey" ;;
    "PRF")
        psql_exec "DELETE FROM $maddogDBSchema.prf WHERE idsite = $id_site AND idtype = $id_measure_type AND creationdate = $date_survey;"
        echo "Delete $type_measure values for this survey $id_survey" ;;
    *)
        echo "Unknown type"
        exit 1 ;;
    esac

    # Delete entry in survey table( cascade delete will remove data in dependent tables )
    psql_exec DELETE FROM $maddogDBSchema.survey WHERE id_survey = $id_survey;

    echo "-- Removing survey data from file system"
    ## Find folders to delete in file system using code_site, id_type, date_survey from history table
    # then read all .meta files to find files to delete ( compare date in meta with date_survey in history table )
    # then delete files and folders if empty    
done


# Update materialized view
echo "-- Updating materialized views"
psql_exec "REFRESH MATERIALIZED VIEW sitemntdate;"
psql_exec "REFRESH MATERIALIZED VIEW sitemeasureprofil;"





echo "-- END PROCESS"