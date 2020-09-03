/* MODULES */
const { dialog } = require('electron');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');
autoUpdater.autoDownload = false;

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

/*  CREATE HTML FOR THE PROGRESS WINDOW */

exports.updater = (window) => {
  autoUpdater.checkForUpdates().catch((err) => console.error);
  autoUpdater.on('update-available', (info) => {
    dialog
      .showMessageBox(window, {
        type: 'info',
        title: 'UPDATE AVAILABLE',
        icon: `${dir}/renderer/icons/trayTemplate.png`,
        message: `P2Sys Viewer v${info.version} is available.\nWould you like to update now?`,
        buttons: ['UPDATE', 'CANCEL'],
      })
      .then((selection) => {
        if (selection.response === 0) {
          autoUpdater.downloadUpdate();
        }
      });
  });

  autoUpdater.on('download-progress', (progress, bps, per, trans) => {
    if (window) {
      window.webContents.send('update-progress', per);
    }
  });

  autoUpdater.on('update-downloaded', () => {
    window.webContents.send('update-downloaded', null);
  });

  autoUpdater.on('error', (err) => {
    /* CHECK IF IT EXISTS */
    fs.existsSync('errorlog.txt')
      ? fs.appendFile('errorlog.txt', `${new Date()} -> Update error: ${err}\n`, 'utf8', () =>
          console.log('Logfile write')
        )
      : fs.writeFile('errorlog.txt', `${new Date()} -> Update error: ${err}\n`, 'utf8', () =>
          console.log('Logfile write')
        );
  });
};

exports.updateNow = () => {
  autoUpdater.quitAndInstall(false, true);
};
