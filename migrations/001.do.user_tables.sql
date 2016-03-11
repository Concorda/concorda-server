CREATE TABLE IF NOT EXISTS sys_entity
(
  id character varying NOT NULL,
  base character varying,
  name character varying,
  fields character varying,
  "zone" character varying,
  seneca json,
  CONSTRAINT pk_sys_entity_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);


CREATE TABLE IF NOT EXISTS sys_account
(
  id character varying NOT NULL,
  orignick character varying,
  name character varying,
  origuser character varying,
  active boolean,
  users character varying,
  CONSTRAINT pk_sys_account_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);


CREATE TABLE IF NOT EXISTS sys_login
(
  id character varying,
  nick character varying,
  email character varying,
  "user" character varying,
  "when" timestamp with time zone,
  why character varying,
  token character varying,
  active boolean,
  auto boolean,
  ended character varying,
  CONSTRAINT pk_sys_login_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);


CREATE TABLE IF NOT EXISTS sys_user
(
  id character varying NOT NULL,
  nick character varying,
  email character varying,
  name character varying,
  active boolean,
  "when" timestamp with time zone,
  salt character varying,
  pass character varying,
  modified timestamp with time zone,
  tags json[],
  CONSTRAINT pk_sys_user_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);


CREATE TABLE IF NOT EXISTS sys_reset
(
  id character varying NOT NULL,
  nick character varying,
  "user" character varying,
  "when" timestamp with time zone,
  active boolean,
  CONSTRAINT pk_sys_reset_id PRIMARY KEY (id)
)
WITH (
  OIDS=FALSE
);
