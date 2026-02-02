#! /bin/bash

# fichier de configuration des infos de connexions
# à la base de données
maddogDBHost=localhost
maddogDBPort=5432
maddogDBName=maddog
maddogDBSchema=public
maddogDBUser=maddog
maddogDBPassword=maddog

# gdal_grid
gdalGridIndivParm="power=6.0:smothing=7.0:radius1=30.0:radius2=30.0:angle=90.0:max_points=0:min_points=1:nodata=-100.0"

# geoserver dir for image mosaic
# this folder have to already exist
rootPath="/data/MADDOG"
mntDirectory=/data/MADDOG/imagemosaic/mnt/

# geoserver dir for image mosaic
geoserverLogin=admin 
geoserverMdp=admin
geoserverUrl=http://localhost:8080/geoserver/rest/workspaces/maddog/coveragestores/mnt/external.imagemosaic
systemUserGeoserver=tomcat
systemGroupGeoserver=tomcat
