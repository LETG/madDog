## Pré-requis

La partie admin doit être sécurisé par basic-authent.

## Configuration nginx nécessaire pour passer le username en paramètre d'url 

```
# Extraction du nom d'utilisateur et réécriture de l'URL 
set $username ""; 
if ($http_authorization ~* basic\s+(.*$) { 
	set $base64_credentials $1; 
	set $decoded_credentials (base64_decode($base64_credentials)); 
	set $username (regex_replace($decoded_credentials, "(.+):(.*)", "$1")); 
} 
# Réécriture de l'URL avec le paramètre username 
rewrite ^/(.*)$ /$1?user=$username break;
```

## Configuration postgrest nécessaire pour accepter les requêtes POST

Actuellement la configuration postgrest est faite avec un user en mode lecture sur la base de données.

Il faut créer un user en mode écriture mais uniquement sur la table history

Il faudrait aussi filtrer dans nginx pour ne permettre les requêtes POST que pour l'url maddogapi/history



