# madDog

Création d'une application cartographique basée sur le Mviewer pour le suivi littoral en Bretagne

En remplacement du site : http://menir.univ-brest.fr/maddog/  

Nouvelle application -> https://portail.indigeo.fr/mviewer/#maddog


## Description des répertoires

Répertoires du projet :

- mviewer : Configuration de l'application mviewer
- vrt : script permettant l'intégration des données en base
- api : le binaire de postrest pour accès aux données via API Rest
- data : élements supplémentaires nécessaire au rendu ou à l'installation
- database : script de création des tables et vues nécessaire à l'application
- formupload : la page et le wps permettant l'upload des données
 
La plateforme MADDOG adossée à l’Infrastructure de Données Géographiques INDIGEO permet la mise à disposition et la visualisation des données relatives à l’évolution du trait de côte (falaises, plages, systèmes dunaires, embouchures). 

Les données diffusées sont acquises à la fois par plusieurs laboratoires de recherche de l’Institut Universitaire Européen de la Mer et par les collectivités locales partenaires de l’observatoire OSIRISC-Litto’Risques. 

Cette plateforme a une double vocation, académique pour la recherche scientifique et la formation, et d’appui à la définition des politiques de gestion et de prévention des risques côtiers d’érosion et de submersion marine.

La refonte de cette plateforme est réalisée grâce au projet INTERREG AGEO (Plateforme Atlantique pour la Gestion des Géo-aléas et des Risques, financé par le FEDER (Fonds Européen de Développement Régional). 

## Fonctionnement MNT

### Fichiers d'entrées

Un MNT est affiché via un Raster (.TIF) généré à partir d'un fichiers de points (CSV). 

Ces CSV sont localisées dans les répertoires MNT de chaque site (e.g /data/MADDOG/VOUGOT/MNT1/202203230901857651129/MNT1_VOUGOT_20170825.csv).

> Comme prévu, le CSV doit être accompagné d'un fichier .meta pour être correctement calculé et utilisable.

### Interpolation

A partir des CSV, Ce TIF est obtenu par interpolation (IDW) via l'outil [gdal_grid](https://gdal.org/programs/gdal_grid.html) de la bibliothèque JAVA GDAL.

Les CSV sont donc transformer en GeoJSON via un VRT ([voir ce fichier](https://github.com/jdev-org/madDog/tree/main/vrt/MNT)) afin que les champs x, y et z soient correctement exploité par l'outil `gdal_grid` qui nécessite la valeur d'élévation en tant que champ disponible pour l'interpolation.

La configuration est localisée ici : 

https://github.com/jdev-org/madDog/blob/main/vrt/config-sample.sh

Vous trouverez la commande et le script ici : 

https://github.com/jdev-org/madDog/blob/main/vrt/vrt2Postgis.sh#L60

En fin de process, les TIF sont disponibles dans le répertoire `/data/MADDOG/imagemosaic/mnt`.

### Imagemosaic

La fonctionnalité Image mosaic de GeoServer est utilisée pour exploiter tous les MNT (.TIF) au sein d'un seul entrepôt. 
Avec ce système, il devient possible d'iinterroger un flux WMS par date (dimension temporelle) et par localisation (voir [documentation GeoServer](https://docs.geoserver.org/stable/en/user/data/raster/imagemosaic/)) à l'aide d'une requête WMS classique, d'un filtre CQL et du paramètre `TIME` : 

> &TIME="2017-05-01"&CQL_FILTER=location like '%VOUGOT%'

* Paramétrage de l'image mosaic

1. les TIF doivent être dans le même répertoire `/imagemosaic/mnt` (vidé au préalable)

2. Une expression régulière doit permettre de récupérer la date dans le nom du TIFF

La RegEx est localisée dans le fichier timeregex.properties, lui même dit être dans le même répertoire que les TIF (`/imagemosaic/mnt`).
Les noms des TIF doivent avoit la même structure.

3. Le fichier de configuration indexer.properties doit permettre d'indexer tous les fichiers

Les paramètres sont localisés le fichier indexer.properties, lui même doit être dans le même répertoire que les TIF (`/imagemosaic/mnt`).

4. Aucun autre fichier ne doit être présent dans le répertoire `/imagemosaic/mnt`

GeoServer s'occupera de générer un SHP contenant les informations `location` et `ingestion` (date).
Le champ `location` est utilisable dans le `CQL_FIlter`.
Le cahmp `ingestion` est utilisable dans le paramètre `TIME` de l'URL via la dimension temporelle de la couche.

5. Configuration de l'entrepôt imagemosaic

- Paramètre de connexion URL (se termine avec un `/`) :
file:///data/MADDOG/imagemosaic/mnt/

6. Configuration de la couche 

*Paramètres de la couverture*

- Cocher `Multithreaded granule loading (disable JAI ImageRead to use it)`
- Bands ==> `1`
- Granule Sorting ==> `ingestion D`

*Dimension*

- Cocher `Enabled` pour la dimension `Temps`
- Présentation ==> `Liste`
- Valeur par défaut ==>  `Use the biggest domain value`
- Cocher `Nearest Match`


7. Choisir le style dans l'onglet "Publication"

8. Sauvegarder

### Nettoyer et relancer le calcul des fichiers et des tables

Avec des droits `root` :

1. Nettoyer le répertoire /imagemosaic/mnt

```
cd /data/MADDOG/imagemosaic/mnt
rm mnt.*
rm *.tiff
rm *.dat
```

2. Rajouter les fichiers indexer.properties et timeregex.properties si absents

3. Vider le fichier /app/madDog/vrt/lastUpdateDate.lock

```
>/app/madDog/vrt/lastUpdateDate.lock
```

4. Génération des tables en base de données

```
cd /app/madDog/database
./createdatabase.sh
```

5. Génération des données et fichiers

```
cd /app/madDog/vrt
./integrateData.sh
```