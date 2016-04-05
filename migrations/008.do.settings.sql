CREATE TABLE IF NOT EXISTS settings
(
  id character varying NOT NULL,
  register_type text,
  auth_type json,
  configured boolean,
  email_template_folder text,
  CONSTRAINT pk_settings_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);

ALTER TABLE client_data DROP COLUMN register_type;
ALTER TABLE client_data DROP COLUMN auth_type;
ALTER TABLE client_data DROP COLUMN configured;
ALTER TABLE client_data DROP COLUMN email_template_folder;
