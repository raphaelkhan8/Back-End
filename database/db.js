const Sequelize = require('sequelize');

module.exports = new Sequelize('your-next-stop', 'postgres', 'postgres',
  {
    host: 'localhost',
    port: 5432,
    dialect: 'postgres',
  });

// module.exports = new Sequelize('postgres://postgres:postgres@localhost:5432/your-next-stop');
