const express = require('express');
const { db, models } = require('./database');

const app = express();

app.use(express.json());

// CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Contorl-Allow-Methods', 'OPTIONS, GET, POST, PUT, DELETE');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    console.log(`${req.ip} ${req.method} ${req.url}`);
    next();
  }
});

app.get('/', (req, res) => {
  res.send({ message: 'HELLO WORLD' });
});

app.post('/users', (req, res) => {
  console.log('req.bodyyyy', req.body);
  models.Users.create(req.body)
    .then((user) => {
      res.send(user);
    }).catch((err) => {
      console.log('Err trying to create the user in the database', err);
      res.status(400).send(err);
    });
});

const PORT = 4201;

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Server listening on port ${PORT}`);
});
