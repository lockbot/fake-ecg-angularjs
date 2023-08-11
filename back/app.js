const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const pgp = require('pg-promise')();
require('dotenv').config();

const { validate } = require('cpf-check');

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

// Validation requirements:
let namePattern = /^[A-Z\u00C0-\u00DD][a-z\u00DE-\u00FF]+((\'[A-Za-z\u00C0-\u00FF]*\s|\s)?(D?d?e?t?\'?a?o?s?\s)?[A-Z\u00C0-\u00DD][a-z\u00DE-\u00FF]+)+$/;

app.post('/', (req, res) => {
  // Date validation requirements:
  let currentDate = new Date();
  let minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 160);
  let inputDate = new Date(req.body.birth);
  // End of date validation requirements.
  if (!namePattern.test(req.body.name) ||  req.body.name.length > 150 || req.body.name.length < 3) {
    console.log('\nHTTP code 400: Invalid name.\n');
    res.status(400).json({error: 'Invalid name.'});
    return;
  }
  if (inputDate > currentDate || inputDate < minDate) {
    console.log('\nHTTP code 400: Invalid birth date.\n');
    res.status(400).json({error: 'Invalid birth date.'});
    return;
  }
  if (!validate(req.body.cpf)) {
    console.log('\nHTTP code 400: Invalid CPF.\n');
    res.status(400).json({error: 'Invalid CPF.'});
    return;
  }
  if (req.body.phone && (req.body.phone.length < 10 || req.body.phone.length > 20)) {
    console.log('\nHTTP code 400: Invalid phone number.\n');
    res.status(400).json({error: 'Invalid phone number.'});
    return;
  }
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

app.post('/ecg/:cpf', (req, res) => {
  init_schema().then(() => {
    // first value is from :cpf ecg_data from the body and ecg_date current date
    db.any('INSERT INTO ecg_display(cpf, ecg_data, ecg_date) VALUES($1, $2, CURRENT_TIMESTAMP) RETURNING *',
      [req.params.cpf, req.body.ecg_data])
      .then(data => {
        res.json(data);
      })
      .catch(error => {
        console.error('Error:', error);
        res.status(500).json({error: 'An error occurred while inserting ecg_display.'});
      });
  });
});

// Define a separate function that fetches ECG data
const fetchEcgData = (cpf) => {
  return init_schema().then(() => {
    return db.one('SELECT * FROM ecg_display WHERE cpf = $1', cpf)
      .then(data => {
        return Promise.resolve(data);
      })
      .catch(error => {
        if (error.code === pgp.errors.queryResultErrorCode.noData) {
          // post it full of 0s, considering ecg_data int[5][20][5]
          let new_ecg_data = Array.from({length: 5}, () => Array.from({length: 20}, () => Array.from({length: 5}, () => 0)))
          db.any('INSERT INTO ecg_display(cpf, ecg_data, ecg_date) VALUES($1, $2, CURRENT_TIMESTAMP) RETURNING *',
            [cpf, new_ecg_data]);
          return Promise.resolve({ecg_data: new_ecg_data});
        } else {
          console.error('Error:', error);
          return Promise.reject({error: 'An error occurred while retrieving or inserting ecg_display.'});
        }
      });
  });
};

// Insert ECG data
const updateEcgData = (cpf, ecg_data) => {
  return init_schema().then(() => {
    return db.any(
      `UPDATE ecg_display SET ecg_data = $2, ecg_date = CURRENT_TIMESTAMP WHERE cpf = $1 RETURNING *`,
      [cpf, ecg_data]
    )
      .then(data => {
        return Promise.resolve(data);
      })
      .catch(error => {
        console.error('Error:', error);
        return Promise.reject({error: 'An error occurred while updating ecg_display.'});
      });
  });
};

module.exports = {
  app,
  handlers: {
    fetchEcgData,
    updateEcgData,
  }
};

// app.listen(3000, () => console.log('Listening on port 3000'));
// we call it in ws_app.js