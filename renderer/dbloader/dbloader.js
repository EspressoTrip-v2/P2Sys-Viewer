const { ipcRenderer } = require('electron');

/* GET WORKING DIRECTORY */
let dir = process.cwd();
if (process.platform === 'win32') {
  let pattern = /[\\]+/g;
  dir = dir.replace(pattern, '/');
}

/* DOM ELEMENTS */
/////////////////
let progressBar = document.getElementById('progress'),
  progressLabel = document.getElementById('spinner-logo');

ipcRenderer.on('db-download', (e, message) => {
  progressLabel.setAttribute('data-label', message.database);
  progressBar.style.setProperty('--width', message.percentage);
});
