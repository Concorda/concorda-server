CREATE TABLE IF NOT EXISTS logging
(
  id character varying NOT NULL,
  action_type text,
  status text,
  entity json,
  user_data json,
  action_date timestamp with time zone,
  remote_address text,
  CONSTRAINT pk_logging_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);