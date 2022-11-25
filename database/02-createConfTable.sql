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
INSERT INTO wpstdcconf VALUES ('VOUGOT', 'TDC1', true, 100, 50);
INSERT INTO wpstdcconf VALUES ('BOUTRO', 'TDC1', false, 100, 50);

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
