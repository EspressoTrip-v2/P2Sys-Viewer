/* MODULES */
const fs = require('fs');

/* GET WORKING DIRECTORY */
let dir = process.cwd();
if (process.platform === 'win32') {
  let pattern = /[\\]+/g;
  dir = dir.replace(pattern, '/');
}

/* READ IN DATABASE SETUP */
exports.databaseSetup = JSON.parse(
  fs.readFileSync(`${dir}/data/appdata/database.json`, 'utf8')
);
