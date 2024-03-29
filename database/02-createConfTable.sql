CREATE TABLE wpsprofconf(
   id_site VARCHAR(6) NOT NULL,
   id_profile VARCHAR(5) NOT NULL,
   max_dist INTEGER NOT NULL DEFAULT 0 ,
   PRIMARY KEY(id_site, id_profile)
);


CREATE TABLE wpstdcconf(
   id_site VARCHAR(6) NOT NULL,
   id_tdc VARCHAR(5) NOT NULL,
   direction BOOLEAN ,
   radial_length INTEGER NOT NULL ,
   radial_distance INTEGER NOT NULL,
   PRIMARY KEY(id_site, id_tdc)
);


-- Trait de cote 
INSERT INTO public.wpstdcconf VALUES ('BOUTRO', 'TDC1', true, 100, 50);
INSERT INTO public.wpstdcconf VALUES ('BETAHO', 'TDC1', false, 100, 50);
INSERT INTO public.wpstdcconf VALUES ('TREFIA', 'TDC1', false, 100, 50);
INSERT INTO public.wpstdcconf VALUES ('PENMAR', 'TDC1', false, 100, 50);
INSERT INTO public.wpstdcconf VALUES ('PLABER', 'TDC1', false, 150, 50);
INSERT INTO public.wpstdcconf VALUES ('VOUGOT', 'TDC1', false, 100, 50);
INSERT INTO public.wpstdcconf VALUES ('GOULVE', 'TDC1', false, 250, 75);
INSERT INTO public.wpstdcconf VALUES ('STEFFO', 'TDC1', true, 80, 25);
INSERT INTO public.wpstdcconf VALUES ('STEFFE', 'TDC1', true, 80, 25);
INSERT INTO public.wpstdcconf VALUES ('STMICH', 'TDC1', true, 100, 25);


-- Profil
INSERT INTO wpsprofconf VALUES ('VOUGOT', 'PRF1', 175);
INSERT INTO wpsprofconf VALUES ('VOUGOT', 'PRF2', 150);
INSERT INTO wpsprofconf VALUES ('VOUGOT', 'PRF3', 170);
INSERT INTO wpsprofconf VALUES ('VOUGOT', 'PRF4', 150);
INSERT INTO wpsprofconf VALUES ('VOUGOT', 'PRF5', 200);
INSERT INTO wpsprofconf VALUES ('VOUGOT', 'PRF6', 200);

-- Information site
INSERT INTO site VALUES (1,'Plage du Vougot','Guissény','VOUGOT');
INSERT INTO site VALUES (2,'Plage de Boutrouilles','Kerlouan','BOUTRO');
INSERT INTO site VALUES (3,'Sillon de Bétahon','Ambon','BETAHO');
INSERT INTO site VALUES (4,'Sillon de Talbert','Pleubian','TALBER');
INSERT INTO site VALUES (5,'Ile de Banneg','Molène','BANNEG');
INSERT INTO site VALUES (6,'Baie de Goulven','Tréflez','GOULVE');
INSERT INTO site VALUES (7,'Plage de Penmarch','Penmarch','PENMAR');
INSERT INTO site VALUES (8,'Plage de Treffiagat','Treffiagat','TREFIA');
INSERT INTO site VALUES (9,'Plage de l''Aber','Crozon','PLABER');
INSERT INTO site VALUES (10,'Baie de Porz Olier','Guissény','PORZOL');
INSERT INTO site VALUES (11,'Plage des Trois Moutons','Lampaul-Ploudalmézeau','3MOUTO');
INSERT INTO site VALUES (12,'Plage de Tréompan','Lampaul-Ploudalmézeau','TREOMP');
INSERT INTO site VALUES (13,'Plage de Corn ar Gazel','Lampaul-Ploudalmézeau','CGAZEL');
INSERT INTO site VALUES (14,'Plage de Coulouarn','Lampaul-Ploudalmézeau','COULOU');
INSERT INTO site VALUES (15,'TEST Plage de Brochu','Quebec','BROCHU');
INSERT INTO site VALUES (16,'Côte meuble de Kerhoazoc','Landunvez','KERHOA');
INSERT INTO site VALUES (17,'Plage de Melon','Porspoder','PMELON');
INSERT INTO site VALUES (18,'Falaise meuble de Keradraon','Lanildut','KERADR');
INSERT INTO site VALUES (19,'Tombolo de Beg ar Vir','Lampaul-Plouarzel','BEGVIR');
INSERT INTO site VALUES (20,'Plage d''Illien','Ploumoguer','ILLIEN');
INSERT INTO site VALUES (21,'Plages de Park an Aod','Carantec','PRKAOD');
INSERT INTO site VALUES (22,'Falaise du lieu-dit Poul Morvan','Carantec','MORVAN');
INSERT INTO site VALUES (23,'La chaise du curé','Carantec','CHACUR');
INSERT INTO site VALUES (24,'Saint-Samson','Plougasnou','SAMSON');
INSERT INTO site VALUES (25,'Le guerzit','Plougasnou','GUERZI');
INSERT INTO site VALUES (26,'Grande plage de Primel','Plougasnou','PRIMEL');
INSERT INTO site VALUES (27,'Moulin de la rive','Locquirec','MOURIV');
INSERT INTO site VALUES (28,'Plage du Trez Hir','Plougonvelin','TREZHI');
INSERT INTO site VALUES (29,'Plages de Park an Iliz','Carantec','PRKILI');
INSERT INTO site VALUES (30,'Plage de Morgat','Morgat','MORGAT');
INSERT INTO site VALUES (31,'Plage de Trez Rouz','Camaret','TREROU');
INSERT INTO site VALUES (32,'Plage du Grand Rocher','Plestin-Les-Grèves','GRDROC');
INSERT INTO site VALUES (33,'Plage de Saint-Efflam Est','Plestin-Les-Grèves','STEFFE');
INSERT INTO site VALUES (34,'Plage de Saint-Efflam Ouest','Plestin-Les-Grèves','STEFFO');
INSERT INTO site VALUES (35,'Plage de Treduder','Treduder','TREDUD');
INSERT INTO site VALUES (36,'Plage de Saint-Michel-en-Grèvre','Saint-Michel-en-Grèvre','STMICH');
INSERT INTO site VALUES (37,'Île de Béniguet','Molène','BENIGU');
INSERT INTO site VALUES (38,'Cordon de Karvedog','Île de Sein','KARVED');
INSERT INTO site VALUES (39,'Plage de Nantouar','Louannec ','NANTOU');
INSERT INTO site VALUES (40,'Plage de Goas Lagorn','Lannion ','LAGORN');
INSERT INTO site VALUES (41,'Plage de Goas Treiz','Trebeurden ','GTREIZ');
INSERT INTO site VALUES (42,'Plage de la Grève Rose','Tregastel ','GRROSE');
INSERT INTO site VALUES (43,'Marais du Launay','Penvénan','LAUNAY');
INSERT INTO site VALUES (44,'Marais de Brestan','Pleubian ','BRESTA');

-- Equipment
INSERT INTO public.equipment VALUES (1, 'DGPS', 'DGPS');
INSERT INTO public.equipment VALUES (2, 'Centipede_RTK', 'Centipede RTK');
INSERT INTO public.equipment VALUES (3, 'Distancemetre', 'Distancemètre');
INSERT INTO public.equipment VALUES (4, 'Extraction_MNT', 'Extraction à partir de MNT');
INSERT INTO public.equipment VALUES (5, 'Numerisation_photographie', 'Numérisation à partir de photographie');

-- Measure type
INSERT INTO public.measure_type VALUES (1, 'TDC', 'TDC : Trait de côte');
INSERT INTO public.measure_type VALUES (2, 'MNT', 'MNT : Modèle Numérique de Terrain');
INSERT INTO public.measure_type VALUES (3, 'PRF', 'PRF : Profil de plage');
INSERT INTO public.measure_type VALUES (4, 'REF', 'REF : Ligne(s) de référence (Cinématique Trait de côte ou Profil de plage)');

-- Operator
INSERT INTO public.operator VALUES (1, 'Scientifique', 'Scientifique');
INSERT INTO public.operator VALUES (2, 'Gestionnaire', 'Gestionnaire');
INSERT INTO public.operator VALUES (3, 'Citoyen', 'Citoyen');
INSERT INTO public.operator VALUES (4, 'Etudiant', 'Etudiant');
