'use strict';

/* MODULES */
////////////
const { remote, ipcRenderer } = require('electron');

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

/* SET NOTIFICATIONS OBJECT IF DOES NOT EXIST */
if (!localStorage.getItem('notifications')) {
  localStorage.setItem(
    'notifications',
    JSON.stringify({
      pasteItems: true,
    })
  );
}
/* SET MONITORFLAG OBJECT IF DOES NOT EXIST */
if (!localStorage.getItem('monitorflag')) {
  localStorage.setItem('monitorflag', true);
}

/* SET MUTE FLAG OBJECT IF DOES NOT EXIST */
if (!localStorage.getItem('muteflag')) {
  localStorage.setItem('muteflag', true);
}

/* SET MUTE FLAG OBJECT IF DOES NOT EXIST */
if (!localStorage.getItem('priceenter')) {
  localStorage.setItem('priceenter', false);
}

/* GET CURRENT WINDOW */
let customerSearchWindow = remote.getCurrentWindow();

/* GLOBAL VARIABLES */
let customerPrices,
  customerPricesNumbersArr,
  localStorageArr,
  customerNumbersSearchList,
  priceListNumber,
  customerNumber,
  customerName,
  jsonFile,
  customerNumberNameJson,
  target;

//////////////////
/* DOM ELEMENTS */
//////////////////

let customerFindBtn = document.getElementById('assist-btn'),
  checkExitBtn = document.getElementById('check-exit-btn'),
  checkViewBtn = document.getElementById('check-view-btn'),
  customerSearchInput = document.getElementById('customer-search'),
  loadingContainer = document.getElementsByClassName('loading-container')[0],
  searchDisabledBox = document.getElementById('search-disabled'),
  customerNumberList = document.getElementById('customer-list'),
  soundClick = document.getElementById('click'),
  soundPopup = document.getElementById('pop'),
  soundError = document.getElementById('error'),
  soundAccept = document.getElementById('accept'),
  customerSearchHtmlDisplay = document.getElementById('check-customer'),
  minimizeBtn = document.getElementById('minimize-search'),
  monitorEye = document.getElementById('monitor-eye'),
  blur = document.getElementById('blur'),
  monitorPasswordPopup = document.getElementById('admin-popup'),
  passwordYes = document.getElementById('admin-yes'),
  passwordNo = document.getElementById('admin-no'),
  password = document.getElementById('password'),
  wrongPasswordPopup = document.getElementById('wrong-popup'),
  audioTag = Array.from(document.getElementsByTagName('audio')),
  muteBtn = document.getElementById('mute'),
  muteLogo = document.getElementById('mute-logo'),
  priceBtn = document.getElementById('price'),
  onlineWarning = document.getElementById('connection-container'),
  closeAppBtn = document.getElementById('connection-close'),
  priceLogo = document.getElementById('price-logo');

///////////////
/* FUNCTIONS */
///////////////
/* RESET THE LIST OF CUSTOMER NUMBERS TO REMOVE CLICKS */
function resetList() {
  customerNumbersSearchList.forEach((el) => {
    el.style.display = 'flex';
    el.setAttribute('class', 'cusnum');
  });
  setTimeout(() => {
    hideLoading();
    hideViewBtn();
    showCustomerBtn();
  }, 500);
}

/* SET THE LOCAL STORAGE ARRAY FOR INCORRECT PRICES */
function localStoragePrices() {
  if (!localStorage.getItem('incorrect-prices')) {
    localStorage.setItem('incorrect-prices', '[]');
    localStorageArr = [];
  } else {
    localStorageArr = JSON.parse(localStorage.getItem('incorrect-prices'));
  }
}

/* FUNCTION CHECK THE MONITOR EYE FLAG */
function checkMonitorEye() {
  if (localStorage.getItem('monitorflag') === 'true') {
    monitorEye.style.fill = '#000';
    monitorEye.title = 'Monitor On';
    /* HIDE AUTO PRICE BUTTON */
    priceBtn.style.visibility = 'hidden';
    priceBtn.title = 'Auto price off';
    ipcRenderer.send('autoprice', 0);
  } else {
    monitorEye.style.fill = '#d1d1d1';
    monitorEye.title = 'Monitor Off';
    /* SHOW ATO PRICE BUTTON */
    priceBtn.style.visibility = 'visible';
    priceLogo.style.fill = '#d1d1d1';
  }
}

checkMonitorEye();

/* FUNCTION CHECK THE MUTE FLAG */
function checkMuteFlag() {
  if (localStorage.getItem('muteflag') === 'false') {
    /* SET FLAG TO FALSE AND TURN OFF ALL SOUND */
    localStorage.setItem('muteflag', false);
    audioTag.forEach((el) => {
      el.muted = true;
    });
    muteLogo.style.fill = '#000';
    muteBtn.title = 'Sound Off';
    ipcRenderer.send('mute-all', true);
  } else {
    /* SET THE FLAG TO TRUE AND TURN OFF ALL SOUND */
    localStorage.setItem('muteflag', true);
    audioTag.forEach((el) => {
      el.muted = false;
    });
    soundClick.play();
    muteLogo.style.fill = '#d1d1d1';
    muteBtn.title = 'Sound On';
    ipcRenderer.send('mute-all', false);
  }
}

if (localStorage.getItem('muteflag') === 'false') {
  checkMuteFlag();
}

/////////////////////////////////
/* CUSTOMER NUMBER SEARCH BOX */
///////////////////////////////

function showViewBtn() {
  checkViewBtn.style.display = 'flex';
}
function hideViewBtn() {
  checkViewBtn.style.display = 'none';
}

/* SELECT BUTTON CONTROL */
function showCustomerBtn() {
  customerFindBtn.style.display = 'flex';
}
function hideCustomerBtn() {
  customerFindBtn.style.display = 'none';
}

/* LOADING CONTAINER CONTROLS */
function showLoading(flag) {
  if (flag) {
    loadingContainer.style.visibility = 'visible';
  } else {
    loadingContainer.style.visibility = 'visible';
    searchDisabledBox.style.display = 'flex';
  }
}

function hideLoading(flag) {
  if (flag) {
    loadingContainer.style.visibility = 'hidden';
  } else {
    loadingContainer.style.visibility = 'hidden';
    searchDisabledBox.style.display = 'none';
  }
}

/* CLEAR CURRENT LIST OF CLICKS FUNCTION */
function clearList() {
  customerNumbersSearchList.forEach((el) => {
    el.setAttribute('class', 'cusnum');
  });
}

/* ADD EVENT LISTENERS TO LIST FUNCTION */
function addListListeners() {
  /* CLICK EVENTS ON CUSTOMER NUMBER SEARCH BOX */
  customerNumbersSearchList = Array.from(customerNumberList.children);
  // CLICK EVENT ON CUSTOMER LIST ITEM
  customerNumbersSearchList.forEach((el) => {
    el.addEventListener('click', (e) => {
      soundClick.play();
      // CLEAR ANY EXISTING CLICKED ELEMENTS THAT WERE PREVIOUSLY CLICKED
      clearList(true);
      // SET THE CLICKED CLASS ON THE SELECTED ELEMENT
      el.setAttribute('class', 'cusnum-clicked');
      customerSearchInput.value = el.textContent;
      customerNumber = customerSearchInput.value;
      /* POPULATE VARIABLES RELATING TO THE PRICELIST */
      customerSearchInput.dispatchEvent(new Event('keyup'));
      customerSearchInput.dispatchEvent(new Event('keyup'));
      showLoading(true);
      getPriceList(customerNumber);
    });
  });
}

/* POPULATE THE CUSTOMER-LIST AND ADD CORRECT CLASSES */
async function populateList() {
  showLoading(true);
  customerPricesNumbersArr = await ipcRenderer.invoke('customer-prices-array', null);
  customerNumberList.innerHTML = '';
  customerPricesNumbersArr.forEach((el) => {
    let html = `
      <dl class="cusnum" id="${el}">${el}</dl>
      `;
    customerNumberList.insertAdjacentHTML('beforeend', html);
  });

  addListListeners();
  hideLoading();
}

/* REMOVE ITEMS IN THE LIST THAT DOES NOT MATCH SEARCH */
customerSearchInput.addEventListener('keyup', (e) => {
  // USE REGEX TO REMOVE ANY UNWANTED CHAR
  let matchStop = /[.]/g;
  customerSearchInput.value = customerSearchInput.value.replace(matchStop, '');

  // REHIDE THE UPDATE BUTTON AND RESUME IF SEARCH CHANGES
  if (customerSearchInput.value.length < 6) {
    // REMOVE ANY MOUSE CLICKED ITEMS
    clearList(true);
    target = null;
    hideViewBtn();
    showCustomerBtn();
  }

  // SORTING CODE
  customerNumbersSearchList.forEach((el) => {
    // CHECK TO SEE IF THE ELEMENT CONTAINS THE SEARCH VALUE
    let hasMatch = el.innerText.includes(customerSearchInput.value.toUpperCase());
    el.style.display = hasMatch ? 'flex' : 'none';
  });
});

customerSearchHtmlDisplay.style.opacity = '1';
customerSearchWindow.focus();

/* LOCAL STORAGE FUNCTION */
localStoragePrices();

/////////////////////
/* EVENT LISTENERS */
/////////////////////
/* MUTE SOUNDS BUTTON */
muteBtn.addEventListener('click', (e) => {
  setTimeout(() => {
    if (localStorage.getItem('muteflag') === 'true') {
      localStorage.setItem('muteflag', false);
      checkMuteFlag();
    } else {
      localStorage.setItem('muteflag', true);
      checkMuteFlag();
    }
  }, 300);
});

/* SIGNAL LOST CLOSE APP */
closeAppBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('close-app', null);
  }, 300);
});

/* AUTO PRICE BUTTON */
priceBtn.addEventListener('click', (e) => {
  soundClick.play();
  if (window.getComputedStyle(priceLogo).fill === 'rgb(209, 209, 209)') {
    /* SEND MESSAGE TO SWITCH ICCORECT PRICE TAG */
    ipcRenderer.send('autoprice', 1);
    priceLogo.style.fill = '#000';
    priceBtn.title = 'Auto price on';
  } else {
    ipcRenderer.send('autoprice', 0);
    priceLogo.style.fill = '#d1d1d1';
    priceBtn.title = 'Auto price off';
  }
});

/* CLOSE BUTTON */
checkExitBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('close-win', null);
  }, 300);
});

/* MONITOR EYE BUTTON */
monitorEye.addEventListener('click', () => {
  soundPopup.play();
  /* SET BLUR */
  blur.style.visibility = 'visible';
  blur.style.backdropFilter = 'blur(4px)';
  /* SHOW POPUP */
  monitorPasswordPopup.show();
});

passwordYes.addEventListener('click', (e) => {
  soundClick.play();
  if (password.value === process.env.ADMIN_PASSWORD) {
    if (localStorage.getItem('monitorflag') === 'true') {
      localStorage.setItem('monitorflag', 'false');
      checkMonitorEye();
      /* SET BLUR */
      blur.style.visibility = 'hidden';
      blur.style.backdropFilter = 'none';
      password.value = '';
      /* SHOW POPUP */
      monitorPasswordPopup.close();
      soundAccept.play();
    } else {
      localStorage.setItem('monitorflag', 'true');
      checkMonitorEye();
      /* SET BLUR */
      blur.style.visibility = 'hidden';
      blur.style.backdropFilter = 'none';
      password.value = '';
      /* SHOW POPUP */
      monitorPasswordPopup.close();
      soundAccept.play();
    }
  } else {
    wrongPasswordPopup.show();
    soundError.play();
    setTimeout(() => {
      wrongPasswordPopup.close();
    }, 1000);
  }
});

passwordNo.addEventListener('click', (e) => {
  soundClick.play();
  monitorPasswordPopup.close();
  blur.style.visibility = 'hidden';
  blur.style.backdropFilter = 'none';
  password.value = '';
});

/* VIEW BUTTON */
checkViewBtn.addEventListener('click', (e) => {
  soundClick.play();
  showLoading();
  /* ADD POPULATION CODE FOR TABLE */
  let message = {
    jsonFile,
    customerName,
    customerNumber,
    priceListNumber,
  };
  let monitorFlag = localStorage.getItem('monitorflag');
  /* SEND THE INCORRECT PRICING ARRAY TO THE MAIN PROCESS */
  let pricingObj = {
    localStorageArr,
    curCustomerName: customerName,
    curCustomerNumber: customerNumber,
    monitorFlag,
  };
  ipcRenderer.send('incorrect-prices', pricingObj);

  if (customerSearchWindow.getChildWindows()[0]) {
    customerSearchWindow.getChildWindows()[0].close();
  }
  resetList();
  customerSearchInput.value = '';
  customerSearchInput.dispatchEvent(new Event('keyup'));

  customerSearchHtmlDisplay.style.opacity = '0';

  /* SEND CSTOMER DETAILS TO OPEN TABLE */
  setTimeout(() => {
    ipcRenderer.send('table-window', message);
    customerSearchWindow.hide();
  }, 500);
});

/* CLOSE CUSTOMER DOCK */
function closeCustomerDock() {
  ipcRenderer.send('close-window-dock', null);
}

/* CUSTOMER FIND BUTTON */
customerFindBtn.addEventListener('click', (e) => {
  soundClick.play();

  // Get window position to send to main process
  let dimensions = customerSearchWindow.getPosition(),
    size = customerSearchWindow.getSize(),
    message = {
      dimensions,
      size,
    };
  if (customerSearchWindow.getChildWindows().length > 0) {
    closeCustomerDock();
    customerSearchInput.focus();
  } else {
    ipcRenderer.send('position', message);
  }
});
/* MINIMIZE */
minimizeBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    customerSearchWindow.minimize();
  }, 300);
});

/* 
jsonFile
customerName
customerNumber
priceListNumber */
/* GET PRICE-LIST FROM DATABASE */
async function getPriceList(customerNumber) {
  // Get the price list number
  let pricelistNumberResult = await ipcRenderer.invoke('get-pricelist-number', customerNumber);
  priceListNumber = pricelistNumberResult;

  let priceListResult = await ipcRenderer.invoke('get-price-list', customerNumber);
  jsonFile = priceListResult['price-list'];
  customerNumber = priceListResult._id;
  customerName = customerNumberNameJson[customerNumber];

  // ONLY SHOW UPDATE BUTTON ONCE ALL DATA IS AVAILABLE
  hideLoading();
  hideCustomerBtn();
  showViewBtn();
}

///////////////////
/* IPC LISTENERS */
///////////////////
ipcRenderer.on('dock-select', (e, message) => {
  /* CLEAR THE INPUT DISPATCH KEYUP EVENT TO REMOVE ANY BACKGROUND */
  customerSearchInput.value = '';
  customerSearchInput.dispatchEvent(new Event('keyup'));

  /* FOCUS SEARCH FIELD AND INSERT CLICKED CYUSTOMER NUMBER */
  customerSearchInput.focus();
  customerSearchInput.value = message;
  customerSearchInput.dispatchEvent(new Event('keyup'));
});

// /* CREATE WINDOW LISTENER */
// ipcRenderer.on('database', async (e, message) => {
//   /* POPULATE THE LIST WITH THE CUSTOMER NUMBERS */
//   fillCustomerPrices();
// });

/* MESSAGE TO EXPAND WINDOW AFTER TABLE CLOSED */
ipcRenderer.on('expand-window', (e, message) => {
  customerSearchHtmlDisplay.style.opacity = '1';
  customerSearchInput.focus();
});

/* MESSAGE TO CREATE DOWNLOAD WINDOW */
ipcRenderer.on('create-download-window', (e, message) => {
  ipcRenderer.send('create-download-window', null);
});

/* MESSAGE TO SEND PERCENTAGE DOWNLOADED */
ipcRenderer.on('update-progress', (e, message) => {
  ipcRenderer.send('update-progress', message);
});

/* UPDATE THE LOCAL STORAGE ARRAY WITH ANY PRICING ERRORS */
ipcRenderer.on('incorrect-prices', (e, message) => {
  let mesString = JSON.stringify(message);
  localStorage.setItem('incorrect-prices', mesString);
});

ipcRenderer.on('populate-list', (e, message) => {
  showLoading();
  populateList();
});

ipcRenderer.on('send-customers', (e, message) => {
  customerNumberNameJson = message;
});

/* COMMUNICATION FOR CUSTOMER DOCK */
ipcRenderer.on('dock-sec', (event, message) => {
  showLoading(true);

  /* FILL SEARCH BOX WITH CUSTOMER NUMBER */
  customerSearchInput.value = message;
  customerSearchInput.dispatchEvent(new Event('keyup'));

  /* GET THE PRICELIST FROM THE DATABASE */
  getPriceList(message);

  customerSearchWindow.focus();
  customerSearchInput.focus();

  /* SEND THE NUMBER TO THE CUSTOMER SEARCH MAKE THE ITEM CLICKED AND SHOW UPDATE BUTTON */
  let item = document.getElementById(message);
  item.setAttribute('class', 'cusnum-clicked');

  /* KEYUP EVENT TO FORCE SORT ALGORITHM  */
  customerSearchInput.dispatchEvent(new Event('keyup'));
  /* DISPLAY THE ITEM AS CLICKED */
  item.style.display = 'flex';
});

/* CONNECTION MONITORING */
ipcRenderer.on('connection-lost', (e) => {
  onlineWarning.style.visibility = 'visible';
});
ipcRenderer.on('connection-found', (e) => {
  onlineWarning.style.visibility = 'hidden';
});
