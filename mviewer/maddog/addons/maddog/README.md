# Description

Ce module est une mise à jour de l'outil MADDOG.

L'ensemble de cette documentation est réservée à l'extension mviewer maddog uniquement et ne renseigne aucune informations sur les services backend WPS localisés ici : 

https://github.com/jdev-org/madDog


## Installation

Ce module a été développé avec mviewer *3.8.x*.

* Les librairies ou extensions localisées dans `/mviewer/maddog/addons` sont obligatoires pour faire fonctionner l'outil MADDOG en plus des librairies incluses dans le coeur mviewer (dans `mviewer/js/lib`).

* Les customlayers, templates, styles et extensions aussi obligatoires sont entièrements fournis dans :

https://github.com/jdev-org/madDog/tree/main/mviewer/maddog

* Le style est localisé ici : 

https://github.com/jdev-org/madDog/tree/main/mviewer/maddog/css

## Configuration

La configuration est localisée dans le fichier `/addons/maddog/config.json`.

### Paramètres

Voici les paramètres du fichiers `/addons/maddog/config.json` à utiliser dans la propriété `options` (voir l'exemple plus bas).


| Propriété                     | Description                                                                                                                                                      |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| highlight.prf                 | <string> Couleur au survol d'un profile                                                                                                                          |
| select.prf                    | <string> Couleur à la sélection d'un profil par le click sur la carte                                                                                            |
| server                        | <string> URL du server cartographique GeoServer                                                                                                                  |
| defaultLayerZoom              | Paramètres liés au zoom par défaut.                                                                                                                              |
|                               | Les paramètres sont décrits en-dessous.                                                                                                                          |
| defaultLayerZoom.namespace    | <string> Namespace de la couche chargée dans la carte qui sera utilisée pour définir l'étendue par défaut.                                                       |
| defaultLayerZoom.layer        | <string> Mviewer ID de la couche chargée sur la carte et à utiliser pour le zoom par défaut.                                                                     |
| defaultLayerZoom.asHomeExtent | <boolean>                                                                                                                                                        |
|                               | Laisser à true pour que le clic sur le bouton "extent par défaut" de la toolbar Mviewer utilise l'étendue de la couche ici définie et non les paramètres du XML. |
|                               | Laisser à false pour utiliser les paramètres du XML pour l'étendue à utiliser au clique sur ce bouton.                                                           |
| defaultLayerZoom.type         | <string> "WMS"  ou "WFS"                                                                                                                                         |
|                               | pour utiliser ou définir une URL correct permettant de récupérer l'extent depuis un getCapabilities (WMS) ou une extent calculée sur les donnée (WFS)            |
| defaultLayerZoom.url          | <string> de l'URL complète d'une couche qui pourra être utilisée comme étendue par défaut si la couche n'est pas chargée.                                        |
|                               | Le paramètre type sera obligatoirement à compléter selon la couche de l'URL.                                                                                     |
| communes                      | Permet la recherche sur les communes via l'autocompletion                                                                                                        |
| communes.url                  | <string> URL du WFS                                                                                                                                              |
| communes.fuseOptions          | Options Fuse à utiliser (non obligatoire) selon la documentation Fuse.                                                                                           |
| communes.idField              | <string> Nom du champ à utiliser comme ID pour chaque feature                                                                                                    |
| communes.label                | <string> Nom du champ à afficher dans la liste de l'autocompletion                                                                                               |
| sites                         | Identique Aux paramètres pour les communes, mais pour les sites.                                                                                                 |
|                               | Voir l'exemple plus bas pour voir les paramètres possibles.                                                                                                      |
| postgrestapi                  | <string> URL de l'API postgREST à utiliser.                                                                                                                      |
| mntApi                  | <string> Ensemble de paramètres pour la récupération des dates par MNT via postgREST                                                                                                                     |
| mntApi.table                  | <string> Nom de la vue ou table pour récupérer les dates à utiliser.                                                                                                                      |
| mntApi.field                  | <string> Nom du champ contenant les dates à utiliser.                                                                                                                      |
| searchLimit                   | Nombre de résultats à retourner lors de l'utilisation de l'autocompletion                                                                                        |
| wps                           | Paramètres globaux pour utiliser les WPS                                                                                                                         |
| wps.url                       | <string> URL du GeoServer cible contenant TOUS les WPS                                                                                                           |
| wps.version                   | <string> version des services                                                                                                                                    |

### Exemple de configuration
  
Voici un exemple complet de configuration : 

```

        "highlight": {
            "prf": "#ffa43b" 
        },
        "select": {
            "prf": "red"
        },
        "server": "https://gis.jdev.fr/geoserver/maddog",
        "defaultLayerZoom": {
            "namespace": "maddog",
            "layer": "communewithsite",
            "asHomeExtent": true,
            "type": "wfs",
            "url": ""
        },
        "communes": {
            "url": "https://gis.jdev.fr/geoserver/maddog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog%3Acommunewithsite&outputFormat=application%2Fjson",
            "fuseOptions": {
                "keys": ["nom"],
                "threshold": 0.3
            },
            "idField": "insee",
            "label": "nom"
        },
        "sites": {
            "url": "https://gis.jdev.fr/geoserver/maddog/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=maddog%3Asitebuffer&outputFormat=application%2Fjson",
            "fuseOptions": {
                "keys": ["namesite"],
                "threshold": 0.3
            },
            "idField": "idsite",
            "label": "namesite"
        },
        "postgrestapi": "https://gis.jdev.fr/maddogapi",
        "mntApi": {
            "table": "sitemntdate",
            "field": "code_site"
        },
        "searchLimit": 10,
        "wps": {
            "url": "https://gis.jdev.fr/geoserver/ows",
            "version": "1.0.0"
        }
    }
```
