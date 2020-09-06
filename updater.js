/* MODULES */
const { dialog, app } = require('electron');
const fs = require('fs');
const { autoUpdater, UpdaterSignal } = require('electron-updater');
const { info } = require('electron-log');
autoUpdater.autoDownload = false;
const signals = new UpdaterSignal(this);

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

/* GET WORKING DIRECTORY */
let dir;
function envFileChange() {
  let fileName = `${process.cwd()}/resources/app.asar`;
  /* LOCAL MODULES */
  if (process.platform === 'win32') {
    let pattern = /[\\]+/g;
    dir = fileName.replace(pattern, '/');
  } else dir = fileName;
}

if (!process.env.NODE_ENV) {
  envFileChange();
} else {
  dir = process.cwd();

  if (process.platform === 'win32') {
    let pattern = /[\\]+/g;
    dir = dir.replace(pattern, '/');
  }
}

/* ERROR GENERATOR */
function erorrFunc(err) {
  fs.existsSync('errorlog.txt')
    ? fs.appendFile('errorlog.txt', `${new Date()} -> Update error: ${err}\n`, 'utf8', () =>
        console.log('Logfile write')
      )
    : fs.writeFile('errorlog.txt', `${new Date()} -> Update error: ${err}\n`, 'utf8', () =>
        console.log('Logfile write')
      );
}

/*  CREATE HTML FOR THE PROGRESS WINDOW */
exports.updater = (window) => {
  autoUpdater.checkForUpdates().catch((err) => {
    erorrFunc(err);
  });

  autoUpdater.on('update-available', (info) => {
    dialog
      .showMessageBox(window, {
        type: 'info',
        title: 'UPDATE AVAILABLE',
        icon: `${dir}/renderer/icons/trayTemplate.png`,
        message: `P2Sys-Viewer v${info.version} is available.\nWould you like to download it now?`,
        detail: info.releaseNotes,
        buttons: ['DOWNLOAD UPDATE', 'CANCEL'],
      })
      .then((selection) => {
        if (selection.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
  });

  /* SEND MESSAGE FOR DOWNLOAD PROGRESS */
  autoUpdater.signals.progress((info) => {
    window.webContents.send('update-progress', info);
  });

  /* SEND MESSAGE ON UPDATE READY TO INSTALL */
  autoUpdater.on('update-downloaded', () => {
    window.webContents.send('update-downloaded', null);
  });

  autoUpdater.on('error', (err) => {
    erorrFunc(err);
  });
};

exports.updateNow = () => {
  autoUpdater.quitAndInstall(false, true);
};
