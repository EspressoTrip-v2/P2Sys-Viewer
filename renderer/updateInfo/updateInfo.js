const { ipcRenderer } = require('electron');

/* GET WORKING DIRECTORY */
let dir;
if (!process.env.NODE_ENV) {
  dir = `${process.cwd()}\\resources\\app.asar`;
} else {
  dir = process.cwd();
}

/* DOM ELEMENTS */
let percent = document.getElementById('percent');

/* LISTENER EVENTS */
ipcRenderer.on('update-percent', (e, message) => {
  percent.setAttribute('percent', message);
});
