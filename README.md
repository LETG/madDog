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

Les CSV sont donc transformés en GeoJSON via un VRT ([voir ce fichier](https://github.com/jdev-org/madDog/tree/main/vrt/MNT)) afin que les champs x, y et z soient correctement exploités par l'outil `gdal_grid` car la valeur d'élévation est nécessaire en tant que champ disponible pour l'interpolation.

- La configuration est localisée ici : 

https://github.com/jdev-org/madDog/blob/main/vrt/config-sample.sh

- Vous trouverez la commande d'interpolation GDAL et le script ici : 

https://github.com/jdev-org/madDog/blob/main/vrt/vrt2Postgis.sh#L60

- Paramètres d'interpolation GDAL

Les paramètres sont renseignés dans la table `mntprocessconf`. 

Cette table `mntprocessconf` est automatiquement créée par le script [02-createConfTable.sql](https://github.com/jdev-org/madDog/blob/issue-98/database/02-createConfTable.sql#L20-L32).

Elle contient autant de champs que de paramètres à renseigner pour l'algorithme à utiliser. Ces paramètres sont ceux attendus par l'algorithme d'interpolation renseigné dans le champ `algo` de la table `mntprocessconf` selon [la documentation](https://gdal.org/programs/gdal_grid.html#invdist) de l'outil **gdal_grid**.

Les sites (e.g VOUGOT) sont par défaut automatiquement renseignés à la création de la table avec des paramètres par défaut pour l'algorithme `invdist` :

https://github.com/jdev-org/madDog/blob/b1df1f875bce3b8c80842a9808a77730ca1282d3/database/02-createConfTable.sql#L104C5-L106

Il faudra alors ajouter manuellement les nouveaux sites dans cette table si nécessaire.

- Modifier l'algorithme d'interpolation utilisé ou les paramètres

Si vous souhaitez modifier le type d'algorithme, vous devez changer la valeur du champ `algo` de la table `mntprocessconf`.

Selon l'algorithme, la liste et le nom des paramètres peuvent varier. Vous devrez donc modifier la structure de la table pour ajouter les paramètres (1 champ par nom de paramètre unique). N'oubliez pas de modifier le script de création de la table si vous ajouter / supprimez un champ (à pousser sur Git) si nécessaire :

https://github.com/jdev-org/madDog/blob/b1df1f875bce3b8c80842a9808a77730ca1282d3/database/02-createConfTable.sql#L20-L32

Ensuite, vous devrez modifier le fichier vrt2Postgis pour adapter la liste des paramètres à utiliser et la commande exécutée si nécessaire :

https://github.com/jdev-org/madDog/blob/ede54f74da92274eab5f41dc98dbd0bdd69c5474/vrt/vrt2Postgis.sh#L64-L67


- Accéder aux TIF produits

En fin de process, les TIF sont disponibles dans le répertoire `/data/MADDOG/imagemosaic/mnt`.

### Imagemosaic

La fonctionnalité Image mosaic de GeoServer est utilisée pour exploiter tous les MNT (.TIF) au sein d'un seul entrepôt. 
Avec ce système, il devient possible d'iinterroger un flux WMS par date (dimension temporelle) et par localisation (voir [documentation GeoServer](https://docs.geoserver.org/stable/en/user/data/raster/imagemosaic/)) à l'aide d'une requête WMS classique (+ filtre CQL + paramètre `TIME`) : 

> &TIME="2017-05-01"&CQL_FILTER=location like '%VOUGOT%'

* Paramétrage de l'image mosaic

1. les TIF doivent être dans le même répertoire `/imagemosaic/mnt` (vidé au préalable)

2. Une expression régulière doit permettre de récupérer la date dans le nom du TIFF 

> Ex: VOUGOT_20020115
> regex=[0-9]{8}

La RegEx est localisée dans le fichier timeregex.properties, lui même doit être dans le même répertoire que les TIF (`/imagemosaic/mnt`).
Les noms des TIF doivent avoit la même structure.

3. Le fichier de configuration indexer.properties doit permettre d'indexer tous les fichiers

Les paramètres sont localisés le fichier indexer.properties, lui même doit être dans le même répertoire que les TIF (`/imagemosaic/mnt`).

4. Aucun autre fichier ne doit être présent dans le répertoire `/imagemosaic/mnt`

GeoServer s'occupera de générer un SHP contenant les informations `location` et `ingestion` (date).
Le champ `location` est utilisable dans le `CQL_FIlter`.
Le cahmp `ingestion` est utilisable dans le paramètre `TIME` de l'URL via la dimension temporelle de la couche.

> Il est possible d'utiliser une table à la place du SHP (Voir la documentation pour plus d'infos)

5. Configuration de l'entrepôt imagemosaic

- Paramètre de connexion URL (se termine avec un `/`) :
`file:///data/MADDOG/imagemosaic/mnt/`

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
