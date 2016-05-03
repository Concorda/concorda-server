CREATE TABLE IF NOT EXISTS client_token
(
  id character varying NOT NULL,
  token text,
  email text,
  CONSTRAINT pk_client_toke_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
