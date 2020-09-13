const { ipcRenderer } = require('electron');

/* DOM ELEMENTS */
/////////////////
let progressBar = document.getElementById('progress'),
  progressLabel = document.getElementById('spinner-logo');

ipcRenderer.on('db-download', (e, message) => {
  progressLabel.setAttribute('data-label', message.database);
  progressBar.style.setProperty('--width', message.percentage);
});
