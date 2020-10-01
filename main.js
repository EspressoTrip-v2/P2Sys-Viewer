/* MODULE IMPORTS */
require('dotenv').config();
const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, screen } = require('electron');
const mongoose = require('mongoose');
const fs = require('fs');

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

/* LOCAL MODULES */
///////////////////
const {
  customerPricesModel,
  customerNumberNameModel,
} = require(`${dir}/database/mongoDbConnect.js`);

const { updater } = require(`${dir}/updater.js`);

/* WINDOW VARIABLES */
let customerSearchWindow,
  tray,
  trayMenu,
  customerNameWindow,
  loadingWindow,
  tableWindow,
  dbLoaderWindow,
  updateWindow;

/* GLOBAL VARIABLES */
let customerNumberName, customerPrices, screenWidth, screenHeight, version;

/* ICON FILE */
if (process.platform === 'win32') {
  iconImage = `${dir}/renderer/icons/icon.ico`;
} else {
  iconImage = `${dir}/renderer/icons/trayTemplate.png`;
}

/* LOGFILE CREATION FUNCTION */
//////////////////////////////
function logfileFunc(message) {
  let fileDir = `${dir}/error-log.txt`;
  /* CHECK IF EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFile(fileDir, `${new Date()}: Database ${message}\n`, (err) => console.log(err));
  } else {
    fs.writeFileSync(fileDir, `${new Date()}: Database ${message}\n`, (err) =>
      console.log(err)
    );
  }
}

/* CONNECT TO DATABASE */
function mongooseConnect() {
  mongoose
    .connect(
      `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.61lij.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      }
    )
    .catch((err) => {
      /* CHECK IF IT EXISTS */
      fs.existsSync('errorlog.txt')
        ? fs.appendFile(
            'errorlog.txt',
            `${new Date()} -> Connection failure: ${err}\n`,
            'utf8',
            () => console.log('Logfile write error')
          )
        : fs.writeFile(
            'errorlog.txt',
            `${new Date()} -> Connection failure: ${err}\n`,
            'utf8',
            () => console.log('Logfile write error')
          );

      dialog.showMessageBoxSync(dbLoaderWindow, {
        type: 'question',
        icon: `${dir}/renderer/icons/trayTemplate.png`,
        message: 'DATABASE NOT AVAILABLE',
        detail:
          'P2Sys Viewer was unable to connect to the database. Please try again when a connection is available',
        buttons: ['EXIT'],
      });
      setTimeout(() => {
        if (dbLoaderWindow) {
          dbLoaderWindow.close();
        }
        app.quit();
      }, 20);
    });
}

let db = mongoose.connection;

/* DB LISTENERS */
//////////////////
db.on('connected', async () => {
  try {
    dbLoaderWindow.webContents.send('db-download', {
      database: 'Downloading CP-Db',
      percentage: 50,
    });
    let queryCustomerPrices = await customerPricesModel.findById('customerPrices').exec();
    customerPrices = queryCustomerPrices._doc;
  } catch (err) {
    logfileFunc(err);
  }
  try {
    dbLoaderWindow.webContents.send('db-download', {
      database: 'Downloading CNN-Db',
      percentage: 100,
    });
    let queryCustomerNumberName = await customerNumberNameModel
      .findById('customerNumberName')
      .exec();
    customerNumberName = queryCustomerNumberName._doc;

    dbLoaderWindow.webContents.send('db-download', {
      database: 'Success',
      percentage: 100,
    });
  } catch (err) {
    logfileFunc(err);
  }

  /* CREATE THE TRAY MENU BY GETTING VERSION AFTER APP LOAD */
  trayMenu = Menu.buildFromTemplate([{ label: `Viewer v${version}` }]);
  /* START CUSTOMER SEARCH WINDOW ON CONNECTION */
  createCustomerSearchWindow();
  db.close();
});

/* FUNCTION TO CREATE TRAY MENU */
function createTray() {
  tray = new Tray(`${dir}/renderer/icons/trayTemplate.png`);
  tray.setContextMenu(trayMenu);
}

////////////////////////////////
/* WINDOW CREATION FUNCTIONS */
//////////////////////////////

/* CREATE CUSTOMER SEARCH WINDOW */
function createCustomerSearchWindow() {
  createTray();
  customerSearchWindow = new BrowserWindow({
    height: 425,
    width: 265,
    backgroundColor: '#00FFFFFF',
    autoHideMenuBar: true,
    center: true,
    frame: false,
    spellCheck: false,
    resizable: false,
    maximizable: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
    icon: iconImage,
  });

  /* LOAD HTML */
  customerSearchWindow.loadFile(`${dir}/renderer/startPage/startPage.html`);

  /* CLOSE LOADING WINDOW SHOW CUSTOMER WINDOW */
  customerSearchWindow.webContents.once('did-finish-load', () => {
    let message = {
      customerNumberName,
      customerPrices,
    };

    /* CLOSE THE LOADING WINDOW */
    if (dbLoaderWindow) {
      dbLoaderWindow.close();
    }
    /* SHOW WINDOW */
    customerSearchWindow.show();

    setTimeout(() => {
      updater(customerSearchWindow);
    }, 3000);

    setTimeout(() => {
      /* SEND DOWNLOADED DATABASE TO SEARCH WINDOW */
      customerSearchWindow.webContents.send('database', message);
    }, 300);
  });

  /* EVENT LISTENER FOR CLOSING */
  customerSearchWindow.on('closed', () => {
    customerSearchWindow = null;
  });
}

/* CREATE SEARCH DOCK */
function createCustomerNameWindow(message) {
  customerNameWindow = new BrowserWindow({
    parent: customerSearchWindow,
    height: 425,
    width: 265,
    x: message.dimensions[0] - 265,
    y: message.dimensions[1],
    autoHideMenuBar: true,
    backgroundColor: '#00FFFFFF',
    frame: false,
    maximizable: false,
    resizable: false,
    spellCheck: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
    icon: iconImage,
  });

  //   LOAD HTML PAGE
  customerNameWindow.loadFile(`${dir}/renderer/cusNameSearch/customerName.html`);
  customerNameWindow.webContents.once('did-finish-load', (e) => {
    customerNameWindow.webContents.send('name-search', {
      customerNameNumber: message.customerNameNumber,
      customerPrices: message.customerPrices,
    });
  });

  //   EVENT LISTENER FOR CLOSING
  customerNameWindow.on('closed', () => {
    customerNameWindow = null;
  });
}

/* LOADING WINDOW */
function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    height: 280,
    width: 280,
    autoHideMenuBar: true,
    backgroundColor: '#00FFFFFF',
    center: true,
    frame: false,
    maximizable: false,
    spellCheck: false,
    movable: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
  });

  //   lOAD HTML PAGE
  loadingWindow.loadFile(`${dir}/renderer/loader/loader.html`);

  //   CLOSING EVENT LISTENER
  loadingWindow.on('closed', () => {
    loadingWindow = null;
  });
}

/* TABLE WINDOW */
function createTableWindow(message) {
  let height;
  if (screenHeight > 830) {
    height = 800;
  } else if (screenHeight <= 830) {
    height = screenHeight - 80;
  }
  tableWindow = new BrowserWindow({
    height: height,
    maxHeight: 880,
    maxWidth: 380,
    width: 380,
    backgroundColor: '#00FFFFFF',
    autoHideMenuBar: true,
    alwaysOnTop: true,
    maximizable: false,
    frame: false,
    center: true,
    show: false,
    spellCheck: false,
    transparent: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
    icon: iconImage,
  });

  //   lOAD HTML PAGE
  tableWindow.loadFile(`${dir}/renderer/table/table.html`);

  tableWindow.webContents.once('did-finish-load', (e) => {
    tableWindow.webContents.send('table-window', message);
    /* CLOSE THE LOADING WINDOW */
    if (loadingWindow) {
      loadingWindow.close();
    }
    tableWindow.show();
  });

  //   DEV TOOLS
  // tableWindow.webContents.openDevTools();

  //   CLOSING EVENT LISTENER
  tableWindow.on('closed', () => {
    customerSearchWindow.webContents.send('expand-window', null);
    setTimeout(() => {
      customerSearchWindow.show();
    }, 500);
    tableWindow = null;
  });
}

/* DBLOADER WINDOW */
function createDbLoaderWindow() {
  dbLoaderWindow = new BrowserWindow({
    height: 250,
    width: 250,
    spellCheck: false,
    resizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    center: true,
    frame: false,
    transparent: true,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    icon: iconImage,
  });

  //   LOAD HTML PAGE
  dbLoaderWindow.loadFile(`${dir}/renderer/dbloader/dbloader.html`);

  //   LOAD DEV TOOLS
  // dbLoaderWindow.webContents.openDevTools();

  //   EVENT LISTENER FOR CLOSING
  dbLoaderWindow.on('closed', () => {
    dbLoaderWindow = null;
  });
}

/* UPDATING WINDOW */
function createUpdateWindow() {
  xPos = screenWidth / 2 - 115;
  updateWindow = new BrowserWindow({
    height: 80,
    width: 240,
    x: xPos,
    y: 0,
    spellCheck: false,
    resizable: false,
    maximizable: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    center: true,
    frame: false,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      devTools: false,
      enableRemoteModule: true,
    },
    icon: `${dir}/renderer/icons/updateTemplate.png`,
  });

  //   LOAD HTML PAGE
  updateWindow.loadFile(`${dir}/renderer/update/update.html`);

  //   LOAD DEV TOOLS
  // updateWindow.webContents.openDevTools();

  //   EVENT LISTENER FOR CLOSING
  updateWindow.on('closed', () => {
    updateWindow = null;
  });
}

/* START THE LOADER */
app.on('ready', () => {
  /* SET APP NAME FOR WINDOWS NOTIFICATIONS*/
  app.setAppUserModelId('P2Sys-Viewer');
  /* SET VERSION VARIABLE */
  version = app.getVersion();

  /* GET SCREEN SIZE */
  let res = screen.getPrimaryDisplay().size;
  screenHeight = res.height;
  screenWidth = res.width;
  setTimeout(() => {
    mongooseConnect();

    createDbLoaderWindow();
  }, 300);
});

/* QUIT APP WHEN ALL WINDOWS ARE CLOSED */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

///////////////////
/* IPC LISTENERS */
///////////////////

/* FIND DOCK CREATION LISTENER */
ipcMain.on('name-search', (e, message) => {
  createCustomerNameWindow(message);
});

/* DOCK SELECTION LISTENER TO PASS NUMBER TO CUSTOMER SEARCH WINDOW */
ipcMain.on('dock-select', (e, message) => {
  if (customerSearchWindow) {
    customerSearchWindow.webContents.send('dock-select', message);
  }
});

/* TABLE WINDOW CREATION MESSAGE */
ipcMain.on('table-window', (e, message) => {
  createLoadingWindow();
  createTableWindow(message);
});

/* CLOSE TABLE WINDOW */
ipcMain.on('close-win', (e, message) => {
  if (tableWindow) {
    tableWindow.close();
  }
  if (updateWindow) {
    let answer = dialog.showMessageBoxSync(customerSearchWindow, {
      type: 'question',
      title: 'DOWNLOAD IN PROGRESS',
      icon: `${dir}/renderer/icons/updateTemplate.png`,
      message: `A update is being downloaded, are you sure you want to exit?`,
      detail:
        'Exiting will cause the download to be cancelled. You will have to download the update when asked on the next restart',
      buttons: ['EXIT', 'CANCEL'],
    });
    if (answer === 0) {
      updateWindow.close();
      setTimeout(() => {
        customerSearchWindow.close();
      }, 50);
    }
  } else {
    customerSearchWindow.close();
  }
});

/* CLOSE DOCK WINDOW */
ipcMain.on('close-window-dock', (e, message) => {
  if (customerNameWindow) {
    customerNameWindow.webContents.send('close-window-dock', null);
  }
});

/* START UPDATE WINDOW */
ipcMain.on('create-download-window', (e, message) => {
  createUpdateWindow();
});
ipcMain.on('update-progress', (e, message) => {
  if (updateWindow) {
    updateWindow.webContents.send('download-percent', message);
    if (message === 100) {
      setTimeout(() => {
        updateWindow.close();
      }, 1000);
    }
  }
});
