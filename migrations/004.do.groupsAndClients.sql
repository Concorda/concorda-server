ALTER TABLE sys_user RENAME COLUMN tags TO groups;
ALTER TABLE sys_user ADD COLUMN clients json[];

ALTER TABLE tag RENAME TO sys_group;
