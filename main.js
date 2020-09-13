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
  customerNameWindow,
  loadingWindow,
  tableWindow,
  dbLoaderWindow,
  updateWindow;

/* GLOBAL VARIABLES */
let customerNumberName, customerPrices, screenWidth, screenHeight;

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
        type: 'info',
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

/* TRAY MENU LAYOUT TEMPLATE */
let trayMenu = Menu.buildFromTemplate([
  { label: 'P2Sys-Viewer' },
  { role: 'minimize' },
  { role: 'about' },
]);

/* CREATE CUSTOMER SEARCH WINDOW */
function createCustomerSearchWindow() {
  let width, height;
  if (screenHeight <= 800) {
    width = 300;
    height = 550;
  } else {
    width = 365;
    height = 600;
  }
  createTray();
  customerSearchWindow = new BrowserWindow({
    height: height,
    width: width,
    backgroundColor: '#00FFFFFF',
    autoHideMenuBar: true,
    center: true,
    frame: false,
    spellCheck: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
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
  let width, height;
  if (screenHeight <= 800) {
    width = 230;
    height = 550;
  } else {
    width = 300;
    height = 600;
  }

  customerNameWindow = new BrowserWindow({
    parent: customerSearchWindow,
    height: height,
    width: width,
    x: message.dimensions[0] - width,
    y: message.dimensions[1],
    autoHideMenuBar: true,
    backgroundColor: '#00FFFFFF',
    frame: false,
    resizable: false,
    spellCheck: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
  });

  //   LOAD HTML PAGE
  customerNameWindow.loadFile(`${dir}/renderer/cusNameSearch/customerName.html`);
  customerNameWindow.webContents.once('did-finish-load', (e) => {
    customerNameWindow.webContents.send('name-search', message.customerNameNumber);
  });

  //   EVENT LISTENER FOR CLOSING
  customerNameWindow.on('closed', () => {
    customerNameWindow = null;
  });
}

/* LOADING WINDOW */
function createLoadingWindow() {
  let width, height;
  if (screenHeight <= 800) {
    width = 320;
    height = 320;
  } else {
    width = 355;
    height = 355;
  }
  loadingWindow = new BrowserWindow({
    height: height,
    width: width,
    autoHideMenuBar: true,
    backgroundColor: '#00FFFFFF',
    center: true,
    frame: false,
    spellCheck: false,
    movable: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      // devTools: false,
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
  let width;
  if (screenHeight <= 800) {
    width = 420;
  } else {
    width = 550;
  }
  tableWindow = new BrowserWindow({
    height: screenHeight,
    width: width,
    autoHideMenuBar: true,
    x: 0,
    y: 0,
    alwaysOnTop: true,
    frame: false,
    movable: false,
    show: false,
    spellCheck: false,
    transparent: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
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
  let width, height;
  if (screenHeight <= 800) {
    width = 350;
    height = 350;
  } else {
    width = 400;
    height = 400;
  }
  dbLoaderWindow = new BrowserWindow({
    height: height,
    width: width,
    spellCheck: false,
    resizable: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    center: true,
    frame: false,
    transparent: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
    },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
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
    width: 230,
    x: xPos,
    y: 0,
    spellCheck: false,
    resizable: false,
    autoHideMenuBar: true,
    alwaysOnTop: true,
    center: true,
    frame: false,
    transparent: true,
    webPreferences: { nodeIntegration: true, enableRemoteModule: true },
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
      type: 'info',
      title: 'DOWNLOAD IN PROGRESS',
      icon: `${dir}/renderer/icons/updateTemplate.png`,
      message: `A update is being downloaded, are you sure yo want to quit?`,
      detail:
        'Exiting will cause the download to be cancelled. You will have to download the update when asked ont he next restart',
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
