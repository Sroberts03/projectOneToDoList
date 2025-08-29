create database if not exists todo_list_db;

use todo_list_db;

create table if not exists todos (
  id int auto_increment primary key,
  title varchar(255) not null,
  completed boolean not null default false,
  created_at timestamp default current_timestamp
);

create table if not exists users (
  id int auto_increment primary key,
  username varchar(50) not null unique,
  password_hash varchar(255) not null,
  created_at timestamp default current_timestamp
);