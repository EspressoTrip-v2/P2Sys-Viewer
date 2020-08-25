/* MODULE IMPORTS */
const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
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
let customerSearchWindow, tray, customerNameWindow, loadingWindow;

/* GLOBAL VARIABLES */
let customerNumberName, customerPrices;

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
      let fileDir = `${dir}/data/logfiles/database-logfile.txt`;
      /* CHECK IF IT EXISTS */
      fs.existsSync(fileDir)
        ? fs.appendFile(fileDir, `${new Date()} -> Connection failure: ${err}\n`, 'utf8', () =>
            console.log('Logfile write error')
          )
        : fs.writeFile(fileDir, `${new Date()} -> Connection failure: ${err}\n`, 'utf8', () =>
            console.log('Logfile write error')
          );
    });
}
mongooseConnect();

let db = mongoose.connection;

db.on('connected', async () => {
  let queryCustomerPrices = await customerPricesModel.findById('customerPrices');
  let queryCustomerNumberName = await customerNumberNameModel.findById('customerNumberName');
  customerPrices = queryCustomerPrices._doc;
  customerNumberName = queryCustomerNumberName._doc;

  /* START CUSTOMER SEARCH WINDOW */
  createCustomerSearchWindow();
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

    customerSearchWindow.webContents.send('database', message);

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

/* CHILD WINDOW CREATION */
function createCustomerNameWindow(message) {
  // Window State windowStateKeeper
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

  //   Load html page
  customerNameWindow.loadFile(`${dir}/renderer/cusNameSearch/customerName.html`);
  customerNameWindow.webContents.on('did-finish-load', (e) => {
    customerNameWindow.webContents.send('name-search', message.customerNameNumber);
  });

  //   Load dev tools
  // customerNameWindow.webContents.openDevTools();

  // Only show on load completion
  customerNameWindow.once('ready-to-show', () => {
    customerNameWindow.show();
  });

  //   Event listener for closing
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

  //   Load html page
  loadingWindow.loadFile(`${dir}/renderer/loader/loader.html`);

  //   Load dev tools
  // loadingWindow.webContents.openDevTools();

  //   Event listener for closing
  loadingWindow.on('closed', () => {
    loadingWindow = null;
  });
}

app.on('ready', () => {
  setTimeout(() => {
    createLoadingWindow();
  }, 300);
});

/* IPC LISTENERS */
ipcMain.on('name-search', (e, message) => {
  createCustomerNameWindow(message);
});

ipcMain.on('dock-select', (e, message) => {
  if (customerSearchWindow) {
    customerSearchWindow.webContents.send('dock-select', message);
  }
});
