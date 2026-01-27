## VRT

### Install
To use VRT you need to install GDAL
For this project we use Postgresql 13.7 with Postgis 3.2.1, we need at least version 3.0.4 of gdal.

* On debian 11 : 

```
apt  install gdal-bin
ogrinfo --version 
```

### VRT -> GEOJson

Example de commande de lancement d'un VRT permettant transformer un csv en geojson

```
cd vrt && ogr2ogr -f "GEOJson" ref1.geojson csvToLine.vrt
```

### CSV -> VRT -> GEOJson -> PostGIS

1. **Description**

Le script `./script/vrt2Postgis.sh` permet d'importer un CSV vers PostGIS selon le modèle défini dans le VRT et selon la documentation gdal suivante : 

https://gdal.org/drivers/vector/pg.html

Ce script va utiliser un VRT temporaire par fichier à importer à partir du fichier `base.vrt`.

Ce script prend 5 paramètres dans cet ordre :
- `vrt`: Nom du fichier VRT à utiliser (dans la version actuelle, le VRT doit être dans le même répertoire que le CSV)
- `table`: Nom de la table à crééer. Par défaut: nom du fichier GEOJson.
- `layerName`: Nom de la couche
- `fileName`: CSV contenant les données pour le VRT 
- `output`: (optionnel) - Nom du fichier GEOJson à créé en sortie du VRT

> Attention : le nom de la table est obligatoire  pour ajouter un objet dans la base

2. **Configuration**

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

3. **Exécution**

```
cd ./script/
sh vrt2Postgis.sh base.vrt prf1_voug PRF1_VOUGOT_20041209 PRF1_VOUGOT_20041209.csv
```

### removeSurvey.sh via crontab

Pour exécuter `removeSurvey.sh` automatiquement, utilisez une crontab du même utilisateur que celui utilisé habituellement pour lancer le script (afin de garder les mêmes droits sur la base et le système de fichiers). Exemple :

```
# Éditer la crontab du bon utilisateur
crontab -e

# Tous les jours à 02:00
0 2 * * * cd /chemin/vers/madDog/vrt && ./removeSurvey.sh >> /chemin/vers/madDog/vrt/removeSurvey.log 2>&1
```
