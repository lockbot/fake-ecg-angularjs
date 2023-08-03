create schema if not exists ecg_db;

set search_path to ecg_db;

create table if not exists regis (
    cpf char(11) primary key,
    name varchar(100) not null,
    birth date not null,
    phone varchar(20)
);

create table if not exists ecg_display (
    cpf char(11) primary key,
    ecg_data int[5][20][5] not null,
    ecg_date timestamp not null,
    constraint fk_cpf foreign key (cpf) references regis(cpf)
);