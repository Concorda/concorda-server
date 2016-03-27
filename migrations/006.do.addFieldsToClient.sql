ALTER TABLE client_data ADD COLUMN protocol character varying;
ALTER TABLE client_data ADD COLUMN host character varying;
ALTER TABLE client_data ADD COLUMN email_template_folder character varying;
ALTER TABLE client_data ADD COLUMN port INTEGER;
ALTER TABLE sys_reset ADD COLUMN token character varying;
