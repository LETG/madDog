
CREATE SEQUENCE lineref_ogc_fid_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE lineref_ogc_fid_seq
    OWNER TO maddog;

CREATE TABLE lineref
(
    ogc_fid integer NOT NULL DEFAULT nextval('lineref_ogc_fid_seq'::regclass),
    idSite VARCHAR(6),
    creationDate date,
    geom geometry(LineString,2154),
    CONSTRAINT lineref_pkey PRIMARY KEY (ogc_fid)
)
WITH (
    OIDS = FALSE
);

ALTER TABLE lineref
    OWNER to maddog;

CREATE INDEX lineref_index
    ON lineref USING gist
    (geom);



CREATE SEQUENCE tdc_ogc_fid_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE tdc_ogc_fid_seq
    OWNER TO maddog;

CREATE TABLE tdc
(
    ogc_fid integer NOT NULL DEFAULT nextval('tdc_ogc_fid_seq'::regclass),
    idSite VARCHAR(6),
    creationDate date,
    geom geometry(LineString,2154),
    CONSTRAINT tdc_pkey PRIMARY KEY (ogc_fid)
)
WITH (
    OIDS = FALSE
);

ALTER TABLE tdc
    OWNER to maddog;

CREATE INDEX tdc_index
    ON tdc USING gist
    (geom);    



CREATE SEQUENCE prf_ogc_fid_seq
    INCREMENT 1
    START 1
    MINVALUE 1
    MAXVALUE 2147483647
    CACHE 1;

ALTER SEQUENCE prf_ogc_fid_seq
    OWNER TO maddog;

CREATE TABLE prf
(
    ogc_fid integer NOT NULL DEFAULT nextval('prf_ogc_fid_seq'::regclass),
    idSite VARCHAR(6),
    creationDate date,
    geom geometry(LineString,2154),
    CONSTRAINT prf_pkey PRIMARY KEY (ogc_fid)
)
WITH (
    OIDS = FALSE
);

ALTER TABLE prf
    OWNER to maddog;

CREATE INDEX prf_index
    ON tdc USING gist
    (geom);    