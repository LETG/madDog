CREATE TABLE measure_type(
   id_measure_type SERIAL,
   type_measure VARCHAR(50)  NOT NULL,
   description_measure VARCHAR(100) ,
   PRIMARY KEY(id_measure_type)
);

CREATE TABLE site(
   id_site SERIAL,
   name_site VARCHAR(100)  NOT NULL,
   commune_site VARCHAR(50) ,
   code_site CHAR(6)  NOT NULL,
   PRIMARY KEY(id_site)
);

CREATE TABLE operator(
   id_operator SERIAL,
   type_operator VARCHAR(100) ,
   description_operator VARCHAR(100) ,
   PRIMARY KEY(id_operator)
);

CREATE TABLE equipment(
   id_equipment SERIAL,
   name_equipment VARCHAR(50) ,
   description_equipment VARCHAR(50) ,
   PRIMARY KEY(id_equipment)
);

CREATE TABLE survey(
   id_survey SERIAL,
   date_survey DATE NOT NULL,
   description_survey VARCHAR(250) ,
   id_measure_type_survey INTEGER NOT NULL,
   id_site INTEGER NOT NULL,
   PRIMARY KEY(id_survey),
   FOREIGN KEY(id_site) REFERENCES site(id_site)
);

CREATE TABLE measure(
   id_measure SERIAL,
   num_measure INTEGER NOT NULL,
   coord_x NUMERIC(25,10)   NOT NULL,
   coord_y NUMERIC(25,10)   NOT NULL,
   coord_z NUMERIC(25,10)  ,
   proj_epsg VARCHAR(50) ,
   date_measure TIMESTAMP,
   description_measure VARCHAR(50) ,
   id_equipment INTEGER NOT NULL,
   id_operator INTEGER NOT NULL,
   id_survey INTEGER NOT NULL,
   PRIMARY KEY(id_measure),
   FOREIGN KEY(id_equipment) REFERENCES equipment(id_equipment),
   FOREIGN KEY(id_operator) REFERENCES operator(id_operator),
   FOREIGN KEY(id_survey) REFERENCES survey(id_survey)
);

CREATE TABLE profil(
   id_survey INTEGER,
   id_measure_type INTEGER,
   num_profil INTEGER,
   PRIMARY KEY(id_survey, id_measure_type),
   FOREIGN KEY(id_survey) REFERENCES survey(id_survey),
   FOREIGN KEY(id_measure_type) REFERENCES measure_type(id_measure_type)
);


