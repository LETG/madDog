CREATE TABLE serviceprofconf(
   id_site VARCHAR(6) NOT NULL,
   id_profile VARCHAR(5) NOT NULL,
   max_dist INTEGER NOT NULL DEFAULT 0 ,
   PRIMARY KEY(id_site, id_profile)
);


CREATE TABLE servicetdcconf(
   id_site VARCHAR(6) NOT NULL,
   id_tdc VARCHAR(5) NOT NULL,
   direction BOOLEAN ,
   radial_length INTEGER NOT NULL ,
   radial_distance INTEGER NOT NULL,
   PRIMARY KEY(id_site, id_tdc)
);


INSERT INTO servicetdcconf VALUES ('VOUGOT', 'TDC1', true, 100, 50);
INSERT INTO servicetdcconf VALUES ('BOUTRO', 'TDC1', false, 100, 50);

INSERT INTO serviceprofconf VALUES ('VOUGOT', 'PRF1', 175);
INSERT INTO serviceprofconf VALUES ('VOUGOT', 'PRF2', 150);
INSERT INTO serviceprofconf VALUES ('VOUGOT', 'PRF3', 170);
INSERT INTO serviceprofconf VALUES ('VOUGOT', 'PRF4', 150);
INSERT INTO serviceprofconf VALUES ('VOUGOT', 'PRF5', 200);
INSERT INTO serviceprofconf VALUES ('VOUGOT', 'PRF6', 200);