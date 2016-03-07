CREATE TABLE IF NOT EXISTS client_data
(
  id character varying NOT NULL,
  name character varying NOT NULL UNIQUE,
  url character varying,
  registerType text[],
  authType json,
  configured boolean,
  appkey character varying NOT NULL UNIQUE,
  CONSTRAINT pk_client_data_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);

