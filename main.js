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

let appData = `${process.env.APPDATA}\\P2Sys-Viewer`;

/* LOCAL MODULES */
///////////////////
const {
  queryAllPriceListNumbers,
  querySinglePriceList,
  querySinglePriceListNumber,
  queryCustomerName,
} = require(`${dir}/database/mongoDbConnect.js`);

const { updater } = require(`${dir}/updater.js`);

const { sendMail } = require(`${dir}/email.js`);
const { logFileFunc } = require(`${dir}/logFile.js`);

/* TEST POWERSHELL FUNCTION */
function testPowerShell() {
  /* TEST POWERSHELL FUNCTIONALITY AND ENSURE IT HAS BEEN RUN ONCE TO ADD IT TO THE CACHE */
  if (process.platform === 'win32') {
    let testSpawn = spawnSync('powershell', ['Get-Date'], { shell: true });
    let error = decoder.write(testSpawn.stderr);
    if (error) {
      let notification = new Notification({
        title: 'Powershell error',
        body:
          'Powershell is required for the inserting of data into the ERP. Please contact your administrator as inserting of product data might not work correctly.',
        icon: `${dir}/renderer/icons/converter-logo.png`,
      });
      notification.show();
    }
  }
}

/* WINDOW VARIABLES */
let customerSearchWindow, tray, trayMenu, customerNameWindow, loadingWindow, tableWindow;

/* GLOBAL VARIABLES */
let customerNameNumberJson,
  customerNumberNameJson,
  customerNumberNameResult,
  screenWidth,
  screenHeight,
  version,
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
  incorrectPriceFlag = false,
  updateInfoWindow,
  connectionString,
  muteAllFag;

let iconImage = `${dir}/renderer/icons/icon.ico`;

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

/* NOTIFICATION FUNCTION */
function notifyMain(message) {
  let notification = new Notification({
    title: message.title,
    body: message.body,
    icon: `${dir}/renderer/icons/converter-logo.png`,
  });
  notification.show();
}

/* CONNECT TO DATABASE */
function mongooseConnect(message) {
  /* TEST DATABASE */
  connectionString = `mongodb+srv://${message.username}:${message.password}@cluster0.z0sd1.mongodb.net/acwhitcher?retryWrites=true&w=majority`;

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
      logFileFunc(err.stack);
      /* INITIAL ERROR CONNECTION */
      dialog
        .showMessageBox(loadingWindow, {
          type: 'error',
          title: 'P2Sys Connection Error',
          icon: `${dir}/renderer/icons/converter-logo.png`,
          message:
            'P2Sys Viewer was unable to connect to the database. Please try again when a connection is available',
          buttons: ['EXIT'],
        })
        .then(() => {
          setTimeout(() => {
            if (loadingWindow) {
              loadingWindow.close();
            }
            app.quit();
          }, 20);
        });
    });
}

let db = mongoose.connection;

/* DB LISTENERS */
//////////////////
db.once('connected', async () => {
  /* QUERY ALL NAMES */
  try {
    customerNumberNameResult = await queryCustomerName(null, true, notifyMain);
  } catch (err) {
    logFileFunc(err.stack);
  }
  convertNumberName();
  /* CREATE THE TRAY MENU BY GETTING VERSION AFTER APP LOAD */
  trayMenu = Menu.buildFromTemplate([{ label: `Viewer v${version}` }]);
  /* START CUSTOMER SEARCH WINDOW ON CONNECTION */
  createCustomerSearchWindow();
});

db.on('disconnected', () => {
  if (customerSearchWindow) {
    if (tableWindow) {
      tableWindow.close();
      globalShortcut.unregisterAll();
      incorrectPriceFlag = false;
      defaultPriceFlag = false;
    }
    customerSearchWindow.webContents.send('connection-lost', null);
  }
});

db.on('error', () => {
  if (customerSearchWindow) {
    if (tableWindow) {
      tableWindow.close();
      globalShortcut.unregisterAll();
      incorrectPriceFlag = false;
      defaultPriceFlag = false;
    }
    customerSearchWindow.webContents.send('connection-lost', null);
  }
});

db.on('reconnected', () => {
  let notification = new Notification({
    title: 'P2Sys database info',
    body: 'Reconnected to the database',
    icon: `${dir}/renderer/icons/converter-logo.png`,
  });
  notification.show();
  customerSearchWindow.webContents.send('connection-found', null);
});

/* FUNCTION TO CREATE TRAY MENU */
function createTray() {
  tray = new Tray(iconImage);
  tray.setContextMenu(trayMenu);
}

/* CREATE NAME NUMBER JSON FOR SEARCH WINDOW */
function convertNumberName() {
  let newObjA = {};
  let newObjB = {};
  customerNumberNameResult.forEach((obj) => {
    newObjA[obj.name] = obj._id;
    newObjB[obj._id] = obj.name;
  });
  customerNameNumberJson = newObjA;
  customerNumberNameJson = newObjB;
}

////////////////////////////////
/* WINDOW CREATION FUNCTIONS */
//////////////////////////////

/* CREATE CUSTOMER SEARCH WINDOW */
function createCustomerSearchWindow() {
  createTray();
  customerSearchWindow = new BrowserWindow({
    width: Math.floor(screenWidth * 0.13),
    height: Math.floor(screenWidth * 0.18),
    maxWidth: Math.floor(screenWidth * 0.16),
    maxHeight: Math.floor(screenWidth * 0.24),
    minHeight: Math.floor(screenWidth * 0.15),
    minWidth: Math.floor(screenWidth * 0.1),
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
      contextIsolation: false,
    },
    icon: iconImage,
  });

  /* LOAD HTML */
  customerSearchWindow.loadFile(`${dir}/renderer/startPage/startPage.html`);

  /* CLOSE LOADING WINDOW SHOW CUSTOMER WINDOW */
  customerSearchWindow.webContents.once('did-finish-load', () => {
    customerSearchWindow.webContents.send('send-customers', customerNumberNameJson);
    customerSearchWindow.webContents.send('populate-list', null);
    /* CLOSE THE LOADING WINDOW */
    if (loadingWindow) {
      loadingWindow.close();
    }
    /* SHOW WINDOW */
    customerSearchWindow.show();

    setTimeout(() => {
      updater(customerSearchWindow);
    }, 3000);
  });

  /* EVENT LISTENER FOR CLOSING */
  customerSearchWindow.on('closed', () => {
    customerSearchWindow = null;
    if (!updateInfoWindow) {
      app.quit();
    }
  });
}

/* CREATE SEARCH DOCK */
function createCustomerNameWindow(message) {
  customerNameWindow = new BrowserWindow({
    parent: customerSearchWindow,
    height: message.size[1],
    width: message.size[0],
    resizable: false,
    x: message.dimensions[0] - message.size[0],
    y: message.dimensions[1],
    autoHideMenuBar: true,
    skipTaskbar: true,
    frame: false,
    spellCheck: false,
    transparent: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });

  //   Load html page
  customerNameWindow.loadFile(`${dir}/renderer/cusNameSearch/customerName.html`);

  //   Load dev tools
  // customerNameWindow.webContents.openDevTools();

  // Only show on load completion
  customerNameWindow.webContents.once('did-finish-load', () => {
    /* SEND NAME-NUMBER JSON AND PRICE-LIST NAMES */
    customerNameWindow.webContents.send('name-search', {
      customerNameNumberJson,
      customerPricesNumbersArr,
    });
    if (loadingWindow) {
      loadingWindow.close();
    }
  });

  //   Event listener for closing
  customerNameWindow.on('closed', () => {
    customerNameWindow = null;
  });
}

/* LOADING WINDOW */
function createLoadingWindow() {
  loadingWindow = new BrowserWindow({
    width: Math.floor(screenWidth * 0.052),
    height: Math.floor(screenWidth * 0.052),
    autoHideMenuBar: true,
    center: true,
    frame: false,
    skipTaskbar: true,
    resizable: false,
    spellCheck: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });

  //   LOAD HTML PAGE
  loadingWindow.loadFile(`${dir}/renderer/loader/loader.html`);

  loadingWindow.webContents.on('did-finish-load', () => {
    loadingWindow.moveTop();
  });

  //   LOAD DEV TOOLS
  // loadingWindow.webContents.openDevTools();

  //   EVENT LISTENER FOR CLOSING
  loadingWindow.on('closed', () => {
    loadingWindow = null;
  });
}

/* TABLE WINDOW */
function createTableWindow(message) {
  tableWindow = new BrowserWindow({
    width: Math.floor(screenWidth * 0.2),
    height: Math.floor(screenWidth * 0.52),
    maxWidth: Math.floor(screenWidth * 0.26),
    maxHeight: Math.floor(screenHeight),
    // maxWidth: 400,
    backgroundColor: '#00FFFFFF',
    autoHideMenuBar: true,
    alwaysOnTop: true,
    maximizable: false,
    frame: false,
    center: true,
    // show: false,
    spellCheck: false,
    transparent: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      worldSafeExecuteJavaScript: true,
      contextIsolation: false,
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

/* UPDATE CORNER INFO */
function createUpdateInfo() {
  updateInfoWindow = new BrowserWindow({
    width: Math.floor(screenWidth * 0.03),
    height: Math.floor(screenWidth * 0.03),
    x: screenWidth - 60,
    y: screenHeight - 100,
    autoHideMenuBar: true,
    center: true,
    frame: false,
    alwaysOnTop: true,
    transparent: true,
    spellCheck: false,
    skipTaskbar: true,
    resizable: false,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });

  //   Load html page
  updateInfoWindow.loadFile(`${dir}/renderer/updateInfo/updateInfo.html`);

  //   Load dev tools
  // updateInfoWindow.webContents.openDevTools();

  //   Event listener for closing
  updateInfoWindow.on('closed', () => {
    updateInfoWindow = null;
  });
}

/* PASSWORD ASK WINDOW CREATION */
function createPasswordGenerateWindow() {
  passwordGenerate = new BrowserWindow({
    width: Math.floor(screenWidth * 0.13),
    height: Math.floor(screenWidth * 0.19),
    maxWidth: Math.floor(screenWidth * 0.16),
    maxHeight: Math.floor(screenWidth * 0.24),
    minHeight: Math.floor(screenWidth * 0.15),
    minWidth: Math.floor(screenWidth * 0.1),
    autoHideMenuBar: true,
    center: true,
    frame: false,
    alwaysOnTop: true,
    spellCheck: false,
    transparent: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });

  //   Load html page
  passwordGenerate.loadFile(`${dir}/renderer/passwordGenerate/passwordGenerate.html`);

  // Only show on load completion
  passwordGenerate.webContents.once('did-finish-load', () => {
    if (loadingWindow) {
      loadingWindow.close();
    }
  });

  //   Load dev tools
  // passwordGenerate.webContents.openDevTools();

  //   Event listener for closing
  passwordGenerate.on('closed', () => {
    passwordGenerate = null;
  });
}

/* PASSWORD ASK WINDOW CREATION */
function createPasswordEnterWindow(hash) {
  passwordEnter = new BrowserWindow({
    width: Math.floor(screenWidth * 0.13),
    height: Math.floor(screenWidth * 0.16),
    maxWidth: Math.floor(screenWidth * 0.18),
    maxHeight: Math.floor(screenWidth * 0.22),
    minHeight: Math.floor(screenWidth * 0.125),
    minWidth: Math.floor(screenWidth * 0.1),
    autoHideMenuBar: true,
    center: true,
    frame: false,
    alwaysOnTop: true,
    spellCheck: false,
    transparent: true,
    webPreferences: {
      // devTools: false,
      nodeIntegration: true,
      enableRemoteModule: true,
      contextIsolation: false,
    },
    icon: iconImage,
  });

  //   Load html page
  passwordEnter.loadFile(`${dir}/renderer/passwordEnter/passwordEnter.html`);

  // Only show on load completion
  passwordEnter.webContents.once('did-finish-load', () => {
    if (loadingWindow) {
      loadingWindow.close();
    }
    passwordEnter.webContents.send('hash', hash);
  });

  //   Load dev tools
  // passwordEnter.webContents.openDevTools();

  //   Event listener for closing
  passwordEnter.on('closed', () => {
    passwordEnter = null;
  });
}

function checkPassword() {
  if (!fs.existsSync(`${appData}/ps_bin.dat`)) {
    createPasswordGenerateWindow();
  } else if (fs.existsSync(`${appData}/ps_bin.dat`)) {
    fs.readFile(`${appData}/ps_bin.dat`, 'utf8', (err, data) => {
      createPasswordEnterWindow(JSON.parse(data).hash);
    });
  }
}

/* START THE LOADER */
app.on('ready', () => {
  /* CHECK TO SEE IF APP ALREADY RUNNING */
  if (!app.requestSingleInstanceLock()) {
    dialog.showMessageBoxSync({
      type: 'error',
      title: 'APP ALREADY RUNNING',
      message: 'Viewer is already running, please check the taskbar.',
      buttons: ['OK'],
    });
    app.quit();
  } else {
    /* SET APP NAME FOR WINDOWS NOTIFICATIONS*/
    app.setAppUserModelId('P2Sys-Viewer');
    /* SET VERSION VARIABLE */
    version = app.getVersion();

    /* POWERSHELL TEST */
    testPowerShell();

    /* GET SCREEN SIZE */
    let res = screen.getPrimaryDisplay().size;
    screenHeight = res.height;
    screenWidth = res.width;
    setTimeout(() => {
      createLoadingWindow();
      checkPassword();
    }, 300);
  }
});

/* QUIT APP WHEN ALL WINDOWS ARE CLOSED */
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

///////////////////
/* IPC LISTENERS */
///////////////////

/* FIND DOCK CREATION LISTENER */
ipcMain.on('position', (e, message) => {
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
  clipboard.clear();
  itemNo = undefined;
  itemValue = undefined;
  itemPricelist = undefined;
});

/* CLOSE TABLE WINDOW */
ipcMain.on('close-win', (e, message) => {
  if (tableWindow) {
    tableWindow.close();
  }
  customerSearchWindow.close();
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

let pasteCount;

/* WINDOWS CHILD PROCESS FOR KEYSTROKES */
/* POWERSHELL MUST BE IN PATH */
function pasteItemNo() {
  if (itemNo) {
    let itemNoPaste;
    if (defaultPriceFlag) {
      let defaultPrice;
      if (itemNo[itemNo.length - 1] === 'T') {
        defaultPrice = 2;
      } else {
        defaultPrice = 1;
      }
      itemNoPaste = [
        '$wshell=New-Object -ComObject wscript.shell;',
        ' Add-Type -AssemblyName System.Windows.Forms;',
        `[System.Windows.Forms.SendKeys]::SendWait('${itemNo}');`,
        '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
        'Sleep .3;',
        '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
        `[System.Windows.Forms.SendKeys]::SendWait('${defaultPrice}');`,
        '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
        'Sleep .2;',
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
        'Sleep .3;',
        '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
        `[System.Windows.Forms.SendKeys]::SendWait('${itemPricelist}');`,
        '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
        'Sleep .2;',
        '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
        'Sleep .2;',
        `[System.Windows.Forms.SendKeys]::SendWait("${itemValue}");`,
      ];
    } else {
      if (pasteCount === 0) {
        itemNoPaste = [
          '$wshell=New-Object -ComObject wscript.shell;',
          ' Add-Type -AssemblyName System.Windows.Forms;',
          `[System.Windows.Forms.SendKeys]::SendWait('${itemNo}');`,
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .8;',
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          `[System.Windows.Forms.SendKeys]::SendWait('${itemPricelist}');`,
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .8;',
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .6;',
          '[System.Windows.Forms.SendKeys]::SendWait("^c");',
        ];
        pasteCount = 1;
      } else {
        itemNoPaste = [
          '$wshell=New-Object -ComObject wscript.shell;',
          ' Add-Type -AssemblyName System.Windows.Forms;',
          `[System.Windows.Forms.SendKeys]::SendWait('${itemNo}');`,
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .3;',
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          `[System.Windows.Forms.SendKeys]::SendWait('${itemPricelist}');`,
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .2;',
          '[System.Windows.Forms.SendKeys]::SendWait("{TAB}");',
          'Sleep .6;',
          '[System.Windows.Forms.SendKeys]::SendWait("^c");',
        ];
      }
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
                type: 'error',
                message: 'Price List Error',
                icon: `${dir}/renderer/icons/converter-logo.png`,
                detail: `It seems that the price-list you have entered might not be on file. Would you like Viewer to use the default price-lists and also fill in all the correct pricing for this customer order?`,
                buttons: ['YES', 'NO'],
              });
              if (answer === 0) {
                defaultPriceFlag = true;
              }
            }
            /* COMPARE PRICELIST VALUE TO SAGE VALUE */
          } else if (sageValue !== parseInt(itemValue)) {
            if (localStorageArr.indexOf(curCustomerNumber) === -1) {
              sendMail(true, curCustomerName, curCustomerNumber, itemNo, sageValue, itemValue);
              localStorageArr.push(curCustomerNumber);
              customerSearchWindow.webContents.send('incorrect-prices', localStorageArr);
              /* ASK IF USER WOULD LIKE THE PRICELIST AUTOMATICALLY ENTERED */
              let answer = dialog.showMessageBoxSync(customerSearchWindow, {
                type: 'error',
                message: 'INCORRECT PRICE FOUND',
                icon: `${dir}/renderer/icons/converter-logo.png`,
                detail:
                  'An incorrect price was detected. Would you like Viewer to fill in all the correct pricing for this customer order?',
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
/* SET THE PASTE VARIABLES */
ipcMain.on('paste-variables', (e, message) => {
  itemValue = message.itemValue;
  itemNo = message.itemNo;
  itemPricelist = message.itemPricelist;
});

/* REGISTER GLOBAL SHORTCUTS */
ipcMain.on('global-shortcuts-register', (e, message) => {
  pasteCount = 0;
  globalShortcut.register('F1', () => {
    pasteItemNo();
  });
  globalShortcut.register('F2', () => {
    pasteItemValue();
  });
});

/* DEFAULT PRICELIST CHECK */
ipcMain.on('default-price', (e, message) => {
  /* CHECK TO SEE IF A REGIONAL PRICE LIST IS USED */
  if (message[0] === '@') {
    defaultPriceFlag = true;
    monitorFlag = false;
  }
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

ipcMain.on('connect-to-database', (e, message) => {
  createLoadingWindow();
  mongooseConnect(message);
});

ipcMain.handle('customer-prices-array', async (e, message) => {
  customerPricesNumbersArr = await queryAllPriceListNumbers(notifyMain);
  return customerPricesNumbersArr;
});

/* CLOSE DOCK WINDOW */
ipcMain.on('close-window-dock', (e, message) => {
  if (customerNameWindow) {
    customerNameWindow.webContents.send('close-window-dock', null);
    customerNameWindow.close();
  }
});

/* UPDATE DOWNLOADED */
ipcMain.on('close-update-window', (e, message) => {
  if (updateInfoWindow) {
    updateInfoWindow.close();
  }
});

/* MESSENGER SERVICE BETWEEN RENDERERS */
ipcMain.on('dock-sec', (e, message) => {
  customerSearchWindow.webContents.send('dock-sec', message);
});

ipcMain.on('close-app', (e, message) => {
  app.exit();
});

ipcMain.on('restart-app', (e, message) => {
  app.relaunch();
  app.exit();
});

/* GET THE PRICE-LIST NUMBER */
ipcMain.handle('get-pricelist-number', async (e, message) => {
  let result = await querySinglePriceListNumber(message, notifyMain);
  return result;
});

/* QUERIES FOR DATABASE */
ipcMain.handle('get-price-list', async (e, message) => {
  let result = await querySinglePriceList(message, notifyMain);
  return result;
});

/* OPEN UPDATE WINDOW */
ipcMain.on('open-update-window', (e, message) => {
  createUpdateInfo();
});

/* UPDATE DOWNLOADED */
ipcMain.on('close-update-window', (e, message) => {
  if (updateInfoWindow) {
    updateInfoWindow.close();
  }
});

/* UPDATE DOWNLOADED */
ipcMain.on('update-progress', (e, message) => {
  if (updateInfoWindow) {
    updateInfoWindow.webContents.send('update-percent', message);
  }
});

ipcMain.on('close-app', (e, message) => {
  app.exit();
});
