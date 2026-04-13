const { Client } = require('pg');
const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: 'password'
});

client.connect()
  .then(() => {
    console.log('Connected to PostgreSQL successfully');
    client.end();
  })
  .catch(err => {
    console.error('Connection failed:', err.message);
  });
