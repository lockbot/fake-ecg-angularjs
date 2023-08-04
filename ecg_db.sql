CREATE SCHEMA IF NOT EXISTS ecg_db;

SET search_path TO ecg_db;

CREATE TABLE IF NOT EXISTS regis (
    cpf CHAR(11) PRIMARY KEY CHECK (length(cpf) = 11),
    name VARCHAR(150) NOT NULL,
    birth DATE NOT NULL,
    phone VARCHAR(11) CHECK (length(phone) = 0 OR (length(phone) >= 10 AND length(phone) <= 11))
);

CREATE TABLE IF NOT EXISTS ecg_display (
    cpf CHAR(11) PRIMARY KEY,
    ecg_data INT[5][20][5] NOT NULL,
    ecg_date TIMESTAMP NOT NULL,
    CONSTRAINT fk_cpf FOREIGN KEY (cpf) REFERENCES regis(cpf)
);
