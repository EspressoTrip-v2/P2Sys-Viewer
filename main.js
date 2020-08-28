/* MODULE IMPORTS */
const { app, BrowserWindow, ipcMain, Tray, Menu, dialog, screen } = require('electron');
const mongoose = require('mongoose');
const fs = require('fs');

/* GET WORKING DIRECTORY */
const dir = process.cwd();

/* LOCAL MODULES */
///////////////////
const {
  customerPricesModel,
  customerNumberNameModel,
} = require(`${dir}/database/mongoDbConnect.js`);
const { databaseSetup } = require(`${dir}/data/objects.js`);

/* WINDOW VARIABLES */
let customerSearchWindow, tray, customerNameWindow, loadingWindow, tableWindow;

/* GLOBAL VARIABLES */
let customerNumberName, customerPrices, screenWidth, screenHeight;

/* CONNECT TO DATABASE */
function mongooseConnect() {
  mongoose
    .connect(
      `mongodb+srv://${databaseSetup['username']}:${databaseSetup['password']}@cluster0.61lij.mongodb.net/acwhitcher?retryWrites=true&w=majority`,
      {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true,
      }
    )
    .catch((err) => {
      /* CREATE ERROR LOG */
      let fileDir = `${dir}/data/logfiles/database-logfile.txt`;
      /* CHECK IF IT EXISTS */
      fs.existsSync(fileDir)
        ? fs.appendFile(fileDir, `${new Date()} -> Connection failure: ${err}\n`, 'utf8', () =>
            console.log('Logfile write error')
          )
        : fs.writeFile(fileDir, `${new Date()} -> Connection failure: ${err}\n`, 'utf8', () =>
            console.log('Logfile write error')
          );

      setTimeout(() => {
        if (loadingWindow) {
          loadingWindow.close();
        }
      }, 500);
      dialog.showMessageBoxSync({
        type: 'info',
        icon: `${dir}/renderer/icons/trayTemplate.png`,
        message: 'DATABASE NOT AVAILABLE',
        detail:
          '\nP2Sys Viewer is an online database application.\n\nConnection to the database could not be made, Please check network connection.',
        buttons: ['OK'],
      });
    });
}
mongooseConnect();

let db = mongoose.connection;

/* DB LISTENERS */
//////////////////
db.on('connected', async () => {
  let queryCustomerPrices = await customerPricesModel.findById('customerPrices');
  let queryCustomerNumberName = await customerNumberNameModel.findById('customerNumberName');
  customerPrices = queryCustomerPrices._doc;
  customerNumberName = queryCustomerNumberName._doc;

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
  { role: 'reload' },
  { role: 'toggleDevTools' },
]);

/* CREATE CUSTOMER SEARCH WINDOW */
function createCustomerSearchWindow() {
  createTray();
  customerSearchWindow = new BrowserWindow({
    height: 600,
    width: 420,
    autoHideMenuBar: true,
    center: true,
    show: false,
    frame: false,
    spellCheck: false,
    transparent: true,
    webPreferences: {
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
    /* SEND DOWNLOADED DATABASE TO SEARCH WINDOW */
    customerSearchWindow.webContents.send('database', message);

    /* CLOSE THE LOADING WINDOW */
    if (loadingWindow) {
      loadingWindow.close();
    }
    customerSearchWindow.show();
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
    height: 605,
    width: 300,
    resizable: false,
    x: message.dimensions[0] - 300,
    y: message.dimensions[1],
    autoHideMenuBar: true,
    opacity: 0,
    show: false,
    center: true,
    frame: false,
    spellCheck: false,
    transparent: true,
    webPreferences: {
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
    customerNameWindow.show();
  });

  //  DEV TOOLS
  // customerNameWindow.webContents.openDevTools();

  //   EVENT LISTENER FOR CLOSING
  customerNameWindow.on('closed', () => {
    customerNameWindow = null;
  });
}

/* LOADING WINDOW */
function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    height: 500,
    width: 500,
    autoHideMenuBar: true,
    center: true,
    frame: false,
    spellCheck: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
    icon: `${dir}/renderer/icons/trayTemplate.png`,
  });

  //   lOAD HTML PAGE
  loadingWindow.loadFile(`${dir}/renderer/loader/loader.html`);

  //   DEV TOOLS
  // loadingWindow.webContents.openDevTools();

  //   CLOSING EVENT LISTENER
  loadingWindow.on('closed', () => {
    loadingWindow = null;
  });
}

/* TABLE WINDOW */
function createTableWindow(message) {
  tableWindow = new BrowserWindow({
    height: screenHeight,
    width: 545,
    autoHideMenuBar: true,
    x: 0,
    y: 0,
    center: true,
    alwaysOnTop: true,
    frame: false,
    movable: false,
    show: false,
    spellCheck: false,
    transparent: true,
    webPreferences: {
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
    customerSearchWindow.show();
    tableWindow = null;
  });
}

/* START THE LOADER */
app.on('ready', () => {
  /* GET SCREEN SIZE */
  let res = screen.getPrimaryDisplay().size;
  screenHeight = res.height;
  screenWidth = res.width;
  setTimeout(() => {
    createLoadingWindow();
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
});
