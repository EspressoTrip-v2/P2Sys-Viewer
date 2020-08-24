/* MODULES */
const fs = require('fs');

/* GET WORKING DIRECTORY */
const dir = process.cwd();

/* READ IN DATABASE SETUP */
exports.databaseSetup = JSON.parse(
  fs.readFileSync(`${dir}/data/appdata/database.json`, 'utf8')
);
