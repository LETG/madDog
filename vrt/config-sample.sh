#! /bin/bash

# fichier de configuration des infos de connexions
# à la base de données
maddogDBHost=localhost
maddogDBPort=5432
maddogDBName=maddog
maddogDBSchema=public
maddogDBUser=maddog
maddogDBPassword=maddog

# mnt
mntConfTable="mntprocessconf"

# geoserver dir for image mosaic
# this folder have to already exist
mntDirectory=/data/MADDOG/imagemosaic

# geoserver dir for image mosaic
geoserverLogin=admin 
geoserverMdp=admin
geoserverUrl=http://localhost:8080/geoserver/rest/workspaces/maddog/coveragestores/mnt/coverages/file.imagemosaic