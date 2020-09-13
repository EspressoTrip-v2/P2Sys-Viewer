/* MODULES */
const { ipcRenderer } = require('electron');

/* DOM ELEMENTS */
//////////////////
let progressBar = document.getElementById('progress');

ipcRenderer.on('download-percent', (e, message) => {
  progressBar.style.setProperty('--width', message);
});
