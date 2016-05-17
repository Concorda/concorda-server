--
-- run with psql -U postgres -f dbschema.sql
--
DROP DATABASE IF EXISTS concordatest;
CREATE DATABASE concordatest WITH ENCODING='UTF8' CONNECTION LIMIT=-1;

-- DROP ROLE concordatest;
CREATE ROLE "concorda" LOGIN PASSWORD 'concorda';

--# connect to the database (works for psql)
\c concordatest