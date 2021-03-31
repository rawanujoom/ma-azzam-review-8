drop table if exists location;
drop table if exists weather;
drop table if exists Park;



CREATE  TABLE IF NOT EXISTS location (name VARCHAR(255),display_name VARCHAR(255),latitude VARCHAR(100) ,longitude VARCHAR(100));

CREATE  TABLE IF NOT EXISTS weather (time VARCHAR(155),forecast VARCHAR (255));

CREATE TABLE IF NOT EXISTS Park (name VARCHAR(255),url VARCHAR(255),fee VARCHAR(10),description VARCHAR(255));

