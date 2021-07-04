/* MODULES */
const { autoUpdater } = require('electron-updater');
autoUpdater.autoDownload = false;

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

/* GET WORKING DIRECTORY */
let dir;
if (!process.env.NODE_ENV) {
  dir = `${process.cwd()}\\resources\\app.asar`;
} else {
  dir = process.cwd();
}

const { logFileFunc } = require(`${dir}/logFile.js`);

/*  CREATE HTML FOR THE PROGRESS WINDOW */
exports.updater = (window) => {
  /* SET PROPERTIES */
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = true;

  autoUpdater.checkForUpdates().catch((err) => {
    logFileFunc(err.stack);
  });

  autoUpdater.on('update-available', (info) => {
    window.webContents.send('start-update', null);
    autoUpdater.downloadUpdate();
  });

  /* SEND MESSAGE ON UPDATE READY TO INSTALL */
  autoUpdater.on('update-downloaded', () => {
    window.webContents.send('download-complete', null);
  });

  autoUpdater.on('download-progress', (info) => {
    let percent = Math.floor(info.percent);
    window.webContents.send('update-progress', percent);
  });

  autoUpdater.on('error', (err) => {
    logFileFunc(err.stack);
  });
};
