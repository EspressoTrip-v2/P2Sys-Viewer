/* MODULES */
const { dialog } = require('electron');
const fs = require('fs');
const { autoUpdater, UpdaterSignal } = require('electron-updater');
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
        type: 'question',
        title: 'UPDATE AVAILABLE',
        icon: `${dir}/renderer/icons/updateTemplate.png`,
        message: `P2Sys-Converter v${info.version} is available.\nWould you like to download it now?`,
        detail: info.releaseNotes,
        buttons: ['DOWNLOAD UPDATE', 'CANCEL'],
      })
      .then((selection) => {
        if (selection.response === 0) {
          autoUpdater.downloadUpdate();
          window.webContents.send('create-download-window', null);
        }
      });
  });

  /* TRY PROGRESS EVENT EMITTER FIRST */
  try {
    autoUpdater.on('download-progress', (info) => {
      window.webContents.send('update-progress', info.percent);
    });
  } catch (err) {
    /* SEND MESSAGE FOR DOWNLOAD PROGRESS */
    autoUpdater.signals.progress((info) => {
      window.webContents.send('update-progress', info.percent);
    });
  }

  /* SEND MESSAGE ON UPDATE READY TO INSTALL */
  autoUpdater.on('update-downloaded', () => {
    dialog
      .showMessageBox(window, {
        type: 'question',
        title: 'UPDATE READY',
        icon: `${dir}/renderer/icons/updateTemplate.png`,
        message: `Would you like to install the update`,
        buttons: ['INSTALL NOW', 'INSTALL LATER'],
      })
      .then((selection) => {
        if (selection.response === 0) {
          autoUpdater.quitAndInstall(false, true);
        } else if (selection.response === 1) {
          ipcRenderer.send('close-download-window');
        }
      });
  });

  autoUpdater.on('error', (err) => {
    erorrFunc(err);
  });
};
