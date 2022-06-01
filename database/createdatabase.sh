#!/bin/bash

# lecture du fichier de configuration des connexions
. config.sh

if [ -z $maddogDBHost ] || [ -z $maddogDBPort ] || [ -z $maddogDBUser ] || [ -z $maddogDBPassword ] || [ -z $maddogDBSchema ] || [ -z $maddogDBName ]
then
    echo "DB CONNEXION INFOS MISSING please configure in config.sh -> END PROCESS "
    exit 1
fi

echo "-- Delete all tables and views"
PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -f 00-dropAll.sql

echo "-- Create spatiale tables"
PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -f 01-createTable.sql

echo "-- Create materialized view"
PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -f 02-createConfTable.sql

echo "-- Insert communes in databases"
ogr2ogr -append -f "PostgreSQL" PG:"host=$maddogDBHost user=$maddogDBUser port=$maddogDBPort dbname=$maddogDBName password=$maddogDBPassword schemas=$maddogDBSchema" -nln communes ../data/comm3857.json --config OGR_TRUNCATE YES

echo "-- Create application tables"
PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -f 03-createSpatialTable.sql

echo "-- Create WPS configuration value tables"
PGPASSWORD=$maddogDBPassword psql -h $maddogDBHost -p $maddogDBPort -d $maddogDBName -U $maddogDBUser -f 04-createView.sql
