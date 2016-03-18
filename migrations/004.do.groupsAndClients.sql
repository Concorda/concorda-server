ALTER TABLE sys_user RENAME COLUMN tags TO grops;
ALTER TABLE sys_user ADD COLUMN clients json[];

ALTER TABLE tag RENAME TO user_group;
