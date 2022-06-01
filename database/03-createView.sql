
-- Création d'un buffer autour du centroîd de la ligne de réference du site
CREATE MATERIALIZED VIEW sitebuffer AS 
	SELECT
		sitebuffer.idSite, -- nom du site sur 6 caractères
		sitebuffer.nameSite,
		sitebuffer.geom -- geometry
	FROM 
	(
		SELECT 
			lineref.idSite,
			site.name_site as nameSite,
			ST_Transform(st_buffer(st_centroid(lineref.geom), 700), 3857) AS geom
		FROM lineref, site WHERE lineref.idType='TDC1' AND lineref.idSite = site.code_site
	) AS sitebuffer ;


-- Create communewithsite 
-- DROP MATERIALIZED VIEW communewithsite ;
-- This view should avec bien created after communes are available
-- ogr2ogr -append -f "PostgreSQL" PG:"host= user= port= dbname=maddog password= schemas=public" -nln communes ../data/comm3857.json
-- Utilisation d'une view materialisée pour accélerer l'affichage par rapport à une vue geoserver
CREATE MATERIALIZED VIEW communewithsite AS 
	SELECT
		commune.nom, -- nom de la commune
		commune.insee, -- code insee
		commune.epci, -- communauté de commune liée
		commune.geom -- geometry
	FROM 
	(
		SELECT 
			communes.nom,
			communes.insee,
			communes.nom_comple as epci,
			communes.wkb_geometry as geom
		FROM communes, sitebuffer where ST_Intersects(sitebuffer.geom, communes.wkb_geometry)
	) AS commune ;

