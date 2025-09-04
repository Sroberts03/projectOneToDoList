create database if not exists projectOneDataDb;

use projectOneDataDb;

create table if not exists users (
  id int auto_increment primary key,
  username varchar(50) not null unique,
  password_hash varchar(255) not null,
  created_at timestamp default current_timestamp
);

create table if not exists todos (
  id int auto_increment primary key,
  title varchar(255) not null,
  completed boolean not null default false,
  due_date date,
  category varchar(50) default 'General',
  created_at timestamp default current_timestamp,
  user_id int not null,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);