/* MODULES */
const { ipcRenderer } = require('electron');

/* DOM ELEMENTS */
//////////////////
let progressBar = document.getElementById('progress'),
  progressContainer = document.getElementById('progress-container');

ipcRenderer.on('download-percent', (e, message) => {
  console.log(message);
  progressBar.style.setProperty('--width', message);
  progressContainer.setAttribute('percentage-label', Math.round(message) + '%');
});
