
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


-- Create sitemntDate
-- Used to get mnt date information for mviewer mnt date search
CREATE MATERIALIZED VIEW IF NOT EXISTS sitemntdate AS
 SELECT survey.id_site,
    site.code_site,
    site.name_site,
    to_date(to_char(survey.date_survey::timestamp with time zone, 'YYYY-MM-DD'::text), 'YYYY-MM-DD'::text) AS date_survey
   FROM survey,
    site,
    measure_type
  WHERE survey.id_site = site.id_site AND survey.id_measure_type_survey = measure_type.id_measure_type AND measure_type.type_measure::text = 'MNT'::text
  ORDER BY (to_date(to_char(survey.date_survey::timestamp with time zone, 'YYYY-MM-DD'::text), 'YYYY-MM-DD'::text)) DESC
WITH DATA;


-- Create sitemeasureprofil
-- Used to get num profil depending on site and measuretype
CREATE MATERIALIZED VIEW IF NOT EXISTS sitemeasureprofil AS
 SELECT 
 	CASE 
		WHEN LENGTH(lineref.idtype) = 5 THEN RIGHT(lineref.idtype, 2)::integer 
		WHEN LENGTH(lineref.idtype) = 4 THEN RIGHT(lineref.idtype, 1)::integer 
	END AS num_profil,
    site.id_site,
    LEFT(lineref.idtype, 3) AS measuretype
   FROM lineref,
    site
  WHERE lineref.idsite::bpchar = site.code_site
WITH DATA;

CREATE OR REPLACE VIEW measuretypebysite
 AS
 SELECT DISTINCT measure_type.type_measure,
    site.code_site
   FROM survey, site, measure_type
   WHERE survey.id_site = site.id_site and survey.id_measure_type_survey = measure_type.id_measure_type ;
