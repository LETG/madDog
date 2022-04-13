## VRT

### Install
To use VRT you need to install GDAL

* On debian : 

```
apt install gdal-bin
```

### VRT -> GEOJson

Example de commande de lancement d'un VRT permettant transformer un csv en geojson

```
cd vrt && ogr2ogr -f "GEOJson" ref1.geojson csvToLine.vrt
```

### CSV -> VRT -> GEOJson -> PostGIS

1. Description

Le script `./script/vrt2Postgis.sh` permet d'importer un CSV vers PostGIS selon le modèle défini dans le VRT et selon la documentation gdal : 

https://gdal.org/drivers/vector/pg.html

Ce script prend 3 paramètres :
- output: Nom du fichier GEOJson à créé en sortie du VRT
- vrt: Nom du fichier VRT à utiliser (dans la version actuelle, le VRT doit être dans le même répertoire que le CSV)
- table (optionnel): Nom de la table à crééer. Par défaut: nom du fichier GEOJson.

> Attention : Si la table existe déjà, le script va supprimer et recréer la table (option overwrite ogr2ogr).

2. Configuration

Ouvrir le script et modifier les informations de connexion à la base de données PostGreSQL :

```
# DB infos
host="127.0.0.1"
port=5432
user=""
schema=""
password=""
db=""
```

3. Exécution

```
cd ./script/
sh vrt2Postgis.sh sh vrt2Postgis.sh PRF1.geojson PRF1_VOUGUOT.vrt table_prf1_test
```