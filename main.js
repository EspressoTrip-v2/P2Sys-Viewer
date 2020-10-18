/* MODULE IMPORTS */
require('dotenv').config();
const {
  app,
  BrowserWindow,
  ipcMain,
  Tray,
  Menu,
  dialog,
  screen,
  clipboard,
  Notification,
  globalShortcut,
} = require('electron');
const mongoose = require('mongoose');
const fs = require('fs');
const spawnSync = require('child_process').spawnSync;
const { StringDecoder } = require('string_decoder');
const decoder = new StringDecoder('utf-8');
const windowStateKeeper = require('electron-window-state');

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
  customerPricelistNumberModel,
} = require(`${dir}/database/mongoDbConnect.js`);

const { updater } = require(`${dir}/updater.js`);

const { sendMail } = require(`${dir}/email.js`);

/* TEST POWERSHELL FUNCTION */
function testPowerShell() {
  /* TEST POWERSHELL FUNCTIONALITY AND ENSURE IT HAS BEEN RUN ONCE TO ADD IT TO THE CACHE */
  if (process.platform === 'win32') {
    let testSpawn = spawnSync('powershell', ['Get-Date'], { shell: true });
    let error = decoder.write(testSpawn.stderr);
    if (error) {
      let notification = new Notification({
        title: 'POWERSHELL ERROR',
        body:
          'Powershell is required for the inserting of data into the ERP. Please contact your administrator as inserting of product data might not work correctly.',
        icon: `${dir}/renderer/icons/error.png`,
      });
      notification.show();
    }
  }
}

/* WINDOW VARIABLES */
let customerSearchWindow,
  tray,
  trayMenu,
  customerNameWindow,
  loadingWindow,
  tableWindow,
  dbLoaderWindow,
  updateWindow,
  tableWindowState,
  customerWindowState,
  connectionString,
  muteAllFag;

/* GLOBAL VARIABLES */
let customerNumberName,
  customerPrices,
  customerPricelistNumber,
  screenWidth,
  screenHeight,
  version,
  iconImage,
  productCodes,
  itemValue,
  itemNo,
  itemPricelist,
  localStorageArr,
  curCustomerName,
  curCustomerNumber,
  sageValue,
  monitorFlag,
  defaultPriceFlag = false,
  incorrectPriceFlag = false;

/* ICON FILE */
if (process.platform === 'win32') {
  iconImage = `${dir}/renderer/icons/icon.ico`;
} else {
  iconImage = `${dir}/renderer/icons/trayTemplate.png`;
}

let s5038Treated = [],
  s5038Untreated = [],
  s5050Untreated = [],
  s5050Treated = [],
  s5076Treated = [],
  s5076Untreated = [];

let s5038Key = 'PNTMB038',
  s5050Key = 'PNTMB050',
  s5076Key = 'PNTMB076';

/* READ IN PRODUCT CODES */
productCodes = JSON.parse(
  fs.readFileSync(`${dir}/templates/s5_all_products.json`, 'utf8', (err, data) => {
    if (err) {
      logfileFunc(err);
    }
  })
)['s5_all_products'];

/* UNTREATED PRODUCT CODE KEYS */
let productCodesKeysUntreated = Object.keys(productCodes['s5_untreated']),
  productCodesUntreated = productCodes['s5_untreated'],
  /* TREATED PRODUCT CODE KEYS */
  productCodesKeysTreated = Object.keys(productCodes['s5_treated']),
  productCodesTreated = productCodes['s5_treated'];

/* 038 PRODUCTS */
/////////////////////
/* UNTREATED 038 */
productCodesKeysUntreated.forEach((pkey) => {
  if (productCodesUntreated[pkey][0].includes(s5038Key)) {
    s5038Untreated.push(productCodesUntreated[pkey][0]);
  }
});
/* TREATED 038 */
productCodesKeysTreated.forEach((pkey) => {
  if (productCodesTreated[pkey][0].includes(s5038Key)) {
    s5038Treated.push(productCodesTreated[pkey][0]);
  }
});

/* 050 PRODUCTS */
/////////////////////

/* UNTREATED 050*/
productCodesKeysUntreated.forEach((pkey) => {
  if (productCodesUntreated[pkey][0].includes(s5050Key)) {
    s5050Untreated.push(productCodesUntreated[pkey][0]);
  }
});
/* TREATED 050*/
productCodesKeysTreated.forEach((pkey) => {
  if (productCodesTreated[pkey][0].includes(s5050Key)) {
    s5050Treated.push(productCodesTreated[pkey][0]);
  }
});

/* 076 PRODUCTS */
/////////////////////

/* UNTREATED 076 */
productCodesKeysUntreated.forEach((pkey) => {
  if (productCodesUntreated[pkey][0].includes(s5076Key)) {
    s5076Untreated.push(productCodesUntreated[pkey][0]);
  }
});
/* TREATED 038 */
productCodesKeysTreated.forEach((pkey) => {
  if (productCodesTreated[pkey][0].includes(s5076Key)) {
    s5076Treated.push(productCodesTreated[pkey][0]);
  }
});

/* LOGFILE CREATION FUNCTION */
//////////////////////////////
function logfileFunc(message) {
  let fileDir = `${dir}/errorlog.txt`;
  /* CHECK IF EXISTS */
  if (fs.existsSync(fileDir)) {
    fs.appendFile(fileDir, `${new Date()}: Main Process: ${message}\n`, (err) =>
      console.log(err)
    );
  } else {
    fs.writeFileSync(fileDir, `${new Date()}: Main Process: ${message}\n`, (err) =>
      console.log(err)
    );
  }
}

/* CONNECT TO DATABASE */
function mongooseConnect() {
  /* TEST DATABASE */
  connectionString = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.z0sd1.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

  /* AC WHITCHER DATABASE */
  // connectionString = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.61lij.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

  mongoose
    .connect(connectionString, {
      useNewUrlParser: true,
      useCreateIndex: true,
      useFindAndModify: false,
      useUnifiedTopology: true,
    })
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

/* DATABASE FAILURE FUNCTION */
function dbFail(dbName) {
  dialog.showMessageBoxSync(dbLoaderWindow, {
    type: 'question',
    icon: `${dir}/renderer/icons/trayTemplate.png`,
    message: 'DATABASE DOWNLOAD FAILURE',
    detail: `Unable to download ${dbName}, please contact your administrator.`,
    buttons: ['EXIT'],
  });
  setTimeout(() => {
    if (dbLoaderWindow) {
      dbLoaderWindow.close();
    }
    app.quit();
  }, 20);
}

/* DB LISTENERS */
//////////////////
db.on('connected', async () => {
  try {
    dbLoaderWindow.webContents.send('db-download', {
      database: 'CP DATABASE',
    });
    let queryCustomerPrices = await customerPricesModel.findById('customerPrices').exec();
    customerPrices = queryCustomerPrices._doc;
  } catch (err) {
    logfileFunc(err);
    dbFail('CP DATABASE');
  }
  try {
    dbLoaderWindow.webContents.send('db-download', {
      database: 'CNN DATABASE',
    });
    let queryCustomerNumberName = await customerNumberNameModel
      .findById('customerNumberName')
      .exec();
    customerNumberName = queryCustomerNumberName._doc;
  } catch (err) {
    logfileFunc(err);
    dbFail('CNN DATABASE');
  }

  try {
    dbLoaderWindow.webContents.send('db-download', {
      database: 'CPN DATABASE',
    });
    let queryCustomerPricelistNumber = await customerPricelistNumberModel
      .findById('customerPricelistNumber')
      .exec();
    customerPricelistNumber = queryCustomerPricelistNumber._doc;
  } catch (err) {
    logfileFunc(err);
    dbFail('CPN DATABASE');
  }

  dbLoaderWindow.webContents.send('db-download', {
    database: 'SUCCESS',
  });
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

/* WINDOW STATES FUNCTION */
////////////////////////////
function windowStates() {
  /* GET SCREEN SIZE */
  let res = screen.getPrimaryDisplay().size;
  screenHeight = res.height;
  screenWidth = res.width;

  /* SET TABLE WINDOW STATE */
  tableWindowState = windowStateKeeper({
    defaultWidth: 320,
    defaultHeight: 800,
    file: 'tableWindowState.json',
  });

  customerWindowState = windowStateKeeper({
    defaultWidth: 215,
    defaultHeight: 325,
    file: 'customerWindowState.json',
  });
}

/* CREATE CUSTOMER SEARCH WINDOW */
function createCustomerSearchWindow() {
  createTray();
  customerSearchWindow = new BrowserWindow({
    height: customerWindowState.height,
    width: customerWindowState.width,
    x: customerWindowState.x,
    y: customerWindowState.y,
    maxHeight: 400,
    maxWidth: 264,
    minHeight: 200,
    minWidth: 132,
    backgroundColor: '#00FFFFFF',
    autoHideMenuBar: true,
    center: true,
    frame: false,
    spellCheck: false,
    maximizable: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
    icon: iconImage,
  });

  /* LOAD HTML */
  customerSearchWindow.loadFile(`${dir}/renderer/startPage/startPage.html`);

  /* MANAGE WINDOW STATE */
  customerWindowState.manage(customerSearchWindow);

  /* CLOSE LOADING WINDOW SHOW CUSTOMER WINDOW */
  customerSearchWindow.webContents.once('did-finish-load', () => {
    let message = {
      customerNumberName,
      customerPrices,
      customerPricelistNumber,
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
    height: customerWindowState.height,
    width: customerWindowState.width,
    /* CHECK TO SEE IF STATE X/Y IS AVAILABLE */
    x:
      typeof customerWindowState.x !== 'undefined'
        ? customerWindowState.x - customerWindowState.width
        : message.dimensions[0] - customerWindowState.width,
    y:
      typeof customerWindowState.y !== 'undefined'
        ? customerWindowState.y
        : message.dimensions[1],
    maxHeight: 400,
    maxWidth: 264,
    minHeight: 200,
    minWidth: 132,
    autoHideMenuBar: true,
    backgroundColor: '#00FFFFFF',
    frame: false,
    maximizable: false,
    resizable: false,
    spellCheck: false,
    transparent: true,
    alwaysOnTop: true,
    fullscreenable: false,
    skipTaskbar: true,
    webPreferences: {
      // devTools: false,
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
    skipTaskbar: true,
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
  tableWindow = new BrowserWindow({
    x: tableWindowState.x,
    y: tableWindowState.y,
    width: tableWindowState.width,
    height: tableWindowState.height,
    maxWidth: 400,
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
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
    },
    icon: iconImage,
  });

  //   lOAD HTML PAGE
  tableWindow.loadFile(`${dir}/renderer/table/table.html`);

  tableWindow.webContents.once('did-finish-load', (e) => {
    let products = {
      s5038Untreated,
      s5038Treated,
      s5050Treated,
      s5050Untreated,
      s5076Treated,
      s5076Untreated,
    };
    tableWindow.webContents.send('products', products);

    tableWindow.webContents.send('table-window', message);
    /* CLOSE THE LOADING WINDOW */
    if (loadingWindow) {
      loadingWindow.close();
    }

    tableWindow.webContents.send('mute-all', muteAllFag);

    tableWindow.show();
  });

  /* MANGE WINDOW STATE */
  tableWindowState.manage(tableWindow);

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
    skipTaskbar: true,
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
      // devTools: false,
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

  /* SET WINDOW STATES */
  windowStates();

  /* POWERSHELL TEST */
  testPowerShell();

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

/* CLOSE DOWNLOAD WINDOW */
ipcMain.on('close-download-window', (e, message) => {
  if (updateWindow) {
    updateWindow.close();
  }
});

/* UPDATER PROGRESS */
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

if (process.platform === 'win32') {
  /* WINDOWS CHILD PROCESS FOR KEYSTROKES */
  /* POWERSHELL MUST BE IN PATH */
  function pasteItemNo() {
    if (itemNo) {
      let itemNoPaste;

      if (defaultPriceFlag) {
        let defaultPrice;
        if (itemNo[itemNo.length - 1] === 'T') {
          defaultPrice = 1;
        } else {
          defaultPrice = 2;
        }
        itemNoPaste = [
          '$wshell=New-Object -ComObject wscript.shell;',
          ' Add-Type -AssemblyName System.Windows.Forms;',
          `[System.Windows.Forms.SendKeys]::SendWait('${itemNo}');`,
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .8;',
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          `[System.Windows.Forms.SendKeys]::SendWait('${defaultPrice}');`,
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .5;',
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .2;',
          `[System.Windows.Forms.SendKeys]::SendWait("${itemValue}");`,
        ];
      } else if (incorrectPriceFlag) {
        itemNoPaste = [
          '$wshell=New-Object -ComObject wscript.shell;',
          ' Add-Type -AssemblyName System.Windows.Forms;',
          `[System.Windows.Forms.SendKeys]::SendWait('${itemNo}');`,
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .8;',
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          `[System.Windows.Forms.SendKeys]::SendWait('${itemPricelist}');`,
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .5;',
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .2;',
          `[System.Windows.Forms.SendKeys]::SendWait("${itemValue}");`,
        ];
      } else {
        itemNoPaste = [
          '$wshell=New-Object -ComObject wscript.shell;',
          ' Add-Type -AssemblyName System.Windows.Forms;',
          `[System.Windows.Forms.SendKeys]::SendWait('${itemNo}');`,
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .8;',
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          `[System.Windows.Forms.SendKeys]::SendWait('${itemPricelist}');`,
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .5;',
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .2;',
          '[System.Windows.Forms.SendKeys]::SendWait("^c");',
        ];
      }

      /* FILL ITEM NUMBER IN ORDER */
      spawnSync('powershell', itemNoPaste);

      if (monitorFlag === 'true') {
        setTimeout(() => {
          sageValueString = clipboard.readText().replace(',', '');
          sageValue = parseInt(sageValueString);
          setTimeout(() => {
            /* CHECK TO SEE IF IT IS A PRICE LIST ENTRY PROBLEM */
            if (isNaN(sageValue) || sageValue <= 2) {
              if (localStorageArr.indexOf(curCustomerNumber) === -1) {
                sendMail(
                  false,
                  curCustomerName,
                  curCustomerNumber,
                  itemNo,
                  sageValue,
                  itemValue
                );
                localStorageArr.push(curCustomerNumber);
                customerSearchWindow.webContents.send('incorrect-prices', localStorageArr);
                /* ASK IF USER WOULD LIKE THE PRICELIST AUTOMATICALLY ENTERED */
                let answer = dialog.showMessageBoxSync(customerSearchWindow, {
                  type: 'question',
                  message: 'PRICE-LIST ERROR',
                  icon: `${dir}/renderer/icons/error.png`,
                  detail: `It seems that the price-list you have entered can not be found. Would you like Viewer to enter the default price-list and fill in all the correct pricing for this order?`,
                  buttons: ['YES', 'NO'],
                });
                if (answer === 0) {
                  defaultPriceFlag = true;
                }
              }
              /* COMPARE PRICELIST VALUE TO SAGE VALUE */
            } else if (sageValue !== parseInt(itemValue)) {
              if (localStorageArr.indexOf(curCustomerNumber) === -1) {
                sendMail(
                  true,
                  curCustomerName,
                  curCustomerNumber,
                  itemNo,
                  sageValue,
                  itemValue
                );
                localStorageArr.push(curCustomerNumber);
                customerSearchWindow.webContents.send('incorrect-prices', localStorageArr);
                /* ASK IF USER WOULD LIKE THE PRICELIST AUTOMATICALLY ENTERED */
                let answer = dialog.showMessageBoxSync(customerSearchWindow, {
                  type: 'question',
                  message: 'INCORRECT PRICE FOUND',
                  icon: `${dir}/renderer/icons/error.png`,
                  detail:
                    'An incorrect price was detected. Would you like Viewer to fill in all the correct pricing for this order?',
                  buttons: ['YES', 'NO'],
                });
                if (answer === 0) {
                  incorrectPriceFlag = true;
                }
                /* IF VALUES ARE EQUAL CHECK TO SEE IF THE CUSTOMER NUMBER IS IN THE ARR AND REMOVE IT */
              }
            } else if (sageValue === parseInt(itemValue)) {
              let idx = localStorageArr.indexOf(curCustomerNumber);
              if (idx !== -1) {
                localStorageArr.splice(idx, 1);
                customerSearchWindow.webContents.send('incorrect-prices', localStorageArr);
              }
            }
          }, 200);
        }, 1000);
      }
    }
  }
  function pasteItemValue() {
    /* CHANGED TO ENTERING THE VALUE AS PASTING DOES NOT WORK */
    if (itemValue) {
      let itemValuePaste = [
        '$wshell=New-Object -ComObject wscript.shell;',
        ' Add-Type -AssemblyName System.Windows.Forms;',
        `[System.Windows.Forms.SendKeys]::SendWait('${itemValue}');`,
      ];
      setTimeout(() => {
        spawnSync('powershell', itemValuePaste);
      }, 200);
    }
  }
} else {
  /* LINUX CHILD PROCESS FOR KEYSTROKES*/
  /* XDOTOOL MUST BE INSTALLED */
  function pasteItemNo() {
    let itemNoPaste = 'xdotool key ctrl+v --clearmodifiers Return Return',
      itemPriceListPaste = 'xdotool key ctrl+v --clearmodifiers Return';
    if (itemNo) {
      clipboard.writeText(itemNo);
      setTimeout(() => {
        spawnSync(itemNoPaste, { shell: true, stdio: 'ignore' });
        setTimeout(() => {
          clipboard.writeText(itemPricelist);
          setTimeout(() => {
            spawnSync(itemPriceListPaste, { shell: true, stdio: 'ignore' });
          }, 200);
        }, 100);
      }, 200);
    }
  }
  function pasteItemValue() {
    let itemValuePaste = 'xdotool key ctrl+v --clearmodifiers Return';
    if (itemValue) {
      clipboard.writeText(itemValue);
      setTimeout(() => {
        spawnSync(itemValuePaste, { shell: true, stdio: 'ignore' });
      }, 200);
    }
  }
}

/* SET THE PASTE VARIABLES */
ipcMain.on('paste-variables', (e, message) => {
  itemValue = message.itemValue;
  itemNo = message.itemNo;
  itemPricelist = message.itemPricelist;
});

/* REGISTER GLOBAL SHORTCUTS */
ipcMain.on('global-shortcuts-register', (e, message) => {
  globalShortcut.register('F1', () => {
    pasteItemNo();
  });
  globalShortcut.register('F2', () => {
    pasteItemValue();
  });
  clipboard.clear();
});

/* UN REGISTER GLOBAL SHORTCUTS */
ipcMain.on('global-shortcuts-unregister', (e, message) => {
  globalShortcut.unregisterAll();
});

/* GET THE INCORRECT PRICING ARRAY FROM TABLE AND CUSTOMER DETAILS */
ipcMain.on('incorrect-prices', (e, message) => {
  localStorageArr = message.localStorageArr;
  curCustomerName = message.curCustomerName;
  curCustomerNumber = message.curCustomerNumber;
  monitorFlag = message.monitorFlag;
});

/* MUTE ALL SOUNDS */
ipcMain.on('mute-all', (e, message) => {
  muteAllFag = message;
});

/* RESET THE FLAGS FOR AUTO ENTER OF PRICES WHEN TABLE IS CLOSED */
ipcMain.on('reset-flags', (e, message) => {
  incorrectPriceFlag = false;
  defaultPriceFlag = false;
});

/* ACTIVATE AUTO PRICE FOR ADMIN */
ipcMain.on('autoprice', (e, message) => {
  if (message === 1) {
    incorrectPriceFlag = true;
  } else {
    incorrectPriceFlag = false;
  }
});
