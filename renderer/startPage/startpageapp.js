/* MODULES */
////////////
const { remote, ipcRenderer, shell } = require('electron');

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

/* GET CURRENT WINDOW */
let customerSearchWindow = remote.getCurrentWindow();

/* GLOBAL VARIABLES */
let customerNumberName, customerPrices, customerNameNumber, numbersDivItems;

//////////////////
/* DOM ELEMENTS */
//////////////////

let customerFindBtn = document.getElementById('assist-btn'),
  checkExitBtn = document.getElementById('check-exit-btn'),
  checkViewBtn = document.getElementById('check-view-btn'),
  checkDisabledBtn = document.getElementById('disabled'),
  customerSearchInput = document.getElementById('customer-search'),
  customerNumberList = document.getElementById('customer-list'),
  soundClick = document.getElementById('click'),
  systemInfoBtn = document.getElementById('info'),
  /* INFO PAGE DOM ELEMENTS */
  systemBackBtn = document.getElementById('back-btn-system'),
  systemEmailDevBtn = document.getElementById('mail-btn'),
  systemDatabaseSettingsBtn = document.getElementById('settings-button'),
  systemSettingsPage = document.getElementsByClassName('system-settings')[0],
  customerSearchHtmlDisplay = document.getElementById('check-customer'),
  versionText = document.getElementById('version'),
  logoContainer = document.getElementById('p2s-logo'),
  updateContainer = document.getElementById('update'),
  downloadProgressBar = document.getElementById('progress'),
  updateBtnContainer = document.getElementById('update-btn-container'),
  updateBtn = document.getElementById('update-btn');

///////////////
/* FUNCTIONS */
///////////////

function resetList() {
  numbersDivItems.forEach((el) => {
    el.style.display = 'block';
    el.setAttribute('class', 'cusnum');
  });
}

/////////////////////////////////
/* CUSTOMER NUMBER SEARCH BOX */
///////////////////////////////

const fillCustomerPrices = () => {
  /* CLEAR CURRENT LIST OF CLICKS FUNCTION */
  const clearList = () => {
    numbersDivItems.forEach((el) => {
      el.setAttribute('class', 'cusnum');
    });
  };

  const addListListeners = () => {
    /* CLICK EVENTS ON CUSTOMER NUMBER SEARCH BOX */
    numbersDivItems = Array.from(customerNumberList.children);
    // CLICK EVENT ON CUSTOMER LIST ITEM
    numbersDivItems.forEach((el) => {
      el.addEventListener('click', (e) => {
        soundClick.play();

        // RESET ALL THE BUTTONS TO DEFAULT
        checkViewBtn.style.display = 'none';
        checkDisabledBtn.style.display = 'flex';

        // SET THE ELEMENT CLICKED TO A GLOBAL VARIABLE
        target = e.target;
        searchValue = target.id;
        // CLEAR ANY EXISTING CLICKED ELEMENTS THAT WERE PREVIOUSLY CLICKED
        clearList();
        // SET THE CLICKED CLASS ON THE SELECTED ELEMENT
        el.setAttribute('class', 'cusnum-clicked');
        customerSearchInput.value = el.textContent;
        customerSearchInput.dispatchEvent(new Event('keyup'));
      });
    });
  };

  /* POPLATE THE CUSTOMERLIST AND ADD CORRECT CLASSES */
  (() => {
    customerNumberList.innerHTML = '';
    customerNumber = Object.keys(customerPrices);
    customerNumber.forEach((el) => {
      let html = `
          <dl class="cusnum" id="${el}">${el}</dl>
          `;
      customerNumberList.insertAdjacentHTML('beforeend', html);
    });

    addListListeners();
  })();

  /* REMOVE ITEMS IN THE LIST THAT DOES NOT MATCH SEARCH */
  customerSearchInput.addEventListener('keyup', (e) => {
    if (customerSearchInput.value.length === 0) {
      clearList();
    }
    // SORTING CODE
    let count = 0;
    numbersDivItems.forEach((el) => {
      // CHECK TO SEE IF THE ELEMENT CONTAINS THE SEARCH VALUE
      let hasMatch = el.innerText.includes(customerSearchInput.value.toUpperCase());
      el.style.display = hasMatch ? 'block' : 'none';
      count += el.style.display === 'none' ? 1 : 0;
    });
    if (Object.keys(customerPrices).includes(customerSearchInput.value.toUpperCase())) {
      /* SET THE ELEMENT REMAINING TO CLICKED */
      document
        .getElementById(customerSearchInput.value.toUpperCase())
        .setAttribute('class', 'cusnum-clicked');

      checkViewBtn.style.display = 'flex';
      checkDisabledBtn.style.display = 'none';
    } else if (
      !Object.keys(customerPrices).includes(customerSearchInput.value.toUpperCase()) &&
      count === Object.keys(customerPrices).length
    ) {
      customerNumberList.style.backgroundImage = `url("${dir}/renderer/icons/cancel.png")`;
      checkViewBtn.style.display = 'none';
      checkDisabledBtn.style.display = 'flex';
    } else {
      customerNumberList.style.backgroundImage = 'none';
      checkViewBtn.style.display = 'none';
      checkDisabledBtn.style.display = 'flex';
    }
  });
  customerSearchHtmlDisplay.style.opacity = '1';
  customerSearchWindow.focus();
};

/* DOM MANIPULATIONS */
///////////////////////
versionText.innerText = `P2Sys Viewer (v${remote.app.getVersion()})`;

/////////////////////
/* EVENT LISTENERS */
/////////////////////
/* CLOSE BUTTON */
checkExitBtn.addEventListener('click', (e) => {
  soundClick.play();
  ipcRenderer.send('close-win', null);
  setTimeout(() => {
    customerSearchWindow.close();
  }, 200);
});

/* VIEW BUTTON */
checkViewBtn.addEventListener('click', (e) => {
  soundClick.play();
  /* ADD POPULATION CODE FOR TABLE */
  let jsonFile = customerPrices[customerSearchInput.value.toUpperCase()];
  let customerName = customerNumberName[customerSearchInput.value.toUpperCase()];
  let message = {
    jsonFile,
    customerName,
    customerNumber: customerSearchInput.value.toUpperCase(),
  };

  if (customerSearchWindow.getChildWindows()[0]) {
    customerSearchWindow.getChildWindows()[0].close();
  }
  resetList();
  customerSearchInput.value = '';
  customerSearchInput.dispatchEvent(new Event('keyup'));

  customerSearchHtmlDisplay.style.opacity = '0';

  setTimeout(() => {
    ipcRenderer.send('table-window', message);
    customerSearchWindow.hide();
  }, 500);
});

/* CUSTOMER FIND BUTTON */
customerFindBtn.addEventListener('click', (e) => {
  soundClick.play();

  /* CREATE MESSAGE FOR THE POSITION AND CONTENTS OF FIND DOCK */
  let dimensions = customerSearchWindow.getPosition();
  let message = {
    dimensions,
    customerNameNumber,
  };

  /* FIND DOCK BUTTON INTERACTION ON CLICK */
  if (customerSearchWindow.getChildWindows()[0]) {
    ipcRenderer.send('close-window-dock', null);
    setTimeout(() => {
      customerSearchWindow.getChildWindows()[0].close();
      customerSearchInput.focus();
    }, 500);
  } else {
    /* SEND MESSAGE TO FIND DOCK */
    ipcRenderer.send('name-search', message);
  }
});

/* SYSTEM INFO BUTTON */
systemInfoBtn.addEventListener('click', (e) => {
  soundClick.play();
  systemSettingsPage.style.display = 'flex';
  setTimeout(() => {
    systemSettingsPage.style.opacity = '1';
  }, 200);
});

/* SYSTEM BACK BUTTON */
systemBackBtn.addEventListener('click', () => {
  soundClick.play();
  systemSettingsPage.style.opacity = '0';
  setTimeout(() => {
    systemSettingsPage.style.display = 'none';
  }, 600);
});

/* EMAIL DEV BUTTON */
systemEmailDevBtn.addEventListener('click', () => {
  soundClick.play();
  shell.openExternal('mailto:juanbo.jb@gmail.com?subject=P2Sys() Inquiry/ Bug report');
});

/* DATABASE SETUP BUTTON */
systemDatabaseSettingsBtn.addEventListener('click', () => {
  soundClick.play();
  shell.openPath('.env');
});

/* UPDATE BUTTON */
updateBtn.addEventListener('click', () => {
  ipcRenderer.send('update-confirm', null);
});

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

/* CREATE WINDOW LISTENER */
ipcRenderer.on('database', async (e, message) => {
  /* REMOVE THE _id TAG FROM DATABASES AND ASSIGN TO GLOBAL VARIABLE */
  customerNumberName = await message.customerNumberName;
  delete customerNumberName['_id'];
  customerNameNumber = {};
  Object.entries(customerNumberName).forEach((el) => {
    customerNameNumber[el[1]] = el[0];
  });
  customerPrices = await message.customerPrices;
  delete customerPrices['_id'];

  /* POPULATE THE LIST WITH THE CUSTOMER NUMBERS */
  fillCustomerPrices();
});

/* MESSAGE TO EXPAND WINDOW AFTER TABLE CLOSED */
ipcRenderer.on('expand-window', (e, message) => {
  customerSearchHtmlDisplay.style.opacity = '1';
  customerSearchInput.focus();
});

/* MESSAGE FROM UPDATER */
ipcRenderer.on('show-update-container', (e, message) => {
  logoContainer.style.opacity = '0';
  updateContainer.style.opacity = '1';
  checkExitBtn.disabled = true;
  checkExitBtn.setAttribute('class', 'btn-disabled');
});

/* UPDATE PERCENTAGE PROGRESS */
ipcRenderer.on('update-progress', (e, message) => {
  downloadProgressBar.style.setProperty('--width', message);
});

/* UPDATE PERCENTAGE PROGRESS */
ipcRenderer.on('update-downloaded', (e, message) => {
  new Notification('UPDATE DOWNLOAD COMPLETE', {
    body: 'P2Sys Viewer update download has completed',
    icon: `${dir}/renderer/icons/trayTemplate.png`,
    requireInteraction: true,
  });
  logoContainer.style.opacity = '0';
  updateContainer.style.opacity = '0';
  updateBtnContainer.style.opacity = '1';
});
