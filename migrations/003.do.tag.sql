CREATE TABLE IF NOT EXISTS tag
(
  id character varying NOT NULL,
  name character varying NOT NULL UNIQUE,
  CONSTRAINT pk_tag_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
