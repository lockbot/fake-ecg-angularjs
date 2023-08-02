const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const connection = {
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DBNAME,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(connection);

init_schema = () => db.none('set search_path to '+process.env.POSTGRES_SCHEMA+';')
  .then(() => {
    console.log('Schema set successfully');
  })
  .catch(error => {
    console.log('Error setting schema:', error);
  });

app.get('/', (req, res) => {
  init_schema().then(() => {
    db.any('SELECT * FROM regis')
      .then(data => {
        res.json(data);
      })
      .catch(error => {
        console.error('Error:', error);
        res.status(500).json({error: 'An error occurred while retrieving regis.'});
      });
  });
});

app.get('/:cpf', (req, res) => {
  init_schema().then(() => {
    db.one('SELECT * FROM regis WHERE cpf = $1', req.params.cpf)
      .then(data => {
        res.json(data);
      })
      .catch(error => {
        console.error('Error:', error);
        res.status(500).json({error: 'An error occurred while retrieving reg.'});
      });
  });
});

app.post('/', (req, res) => {
  init_schema().then(() => {
    db.any('INSERT INTO regis(name, birth, cpf, phone) VALUES($1, $2, $3, $4) RETURNING *',
      [req.body.name, req.body.birth, req.body.cpf, req.body.phone])
      .then(data => {
        res.json(data);
      })
      .catch(error => {
        console.error('Error:', error);
        res.status(500).json({error: 'An error occurred while inserting reg.'});
      });
  });
});

app.listen(3000, () => console.log('Listening on port 3000'));
