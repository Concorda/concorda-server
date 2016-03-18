ALTER TABLE sys_user RENAME COLUMN tags TO grops;
ALTER TABLE sys_user ADD COLUMN clients tags json[];

ALTER TABLE tag RENAME TO group;
