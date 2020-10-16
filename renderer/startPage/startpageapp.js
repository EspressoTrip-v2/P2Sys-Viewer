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

/* GET CURRENT WINDOW */
let customerSearchWindow = remote.getCurrentWindow();
window.search = customerSearchWindow;

/* GLOBAL VARIABLES */
let customerNumberName,
  customerPrices,
  customerNameNumber,
  customerPricelistNumber,
  numbersDivItems,
  localStorageArr,
  curCustomerName,
  curCustomerNumber;

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
  customerSearchHtmlDisplay = document.getElementById('check-customer'),
  minimizeBtn = document.getElementById('minimize-search');

///////////////
/* FUNCTIONS */
///////////////
/* RESET THE LIST OF CUSTOMER NUMBERS TO REMOVE CLICKS */
function resetList() {
  numbersDivItems.forEach((el) => {
    el.style.display = 'block';
    el.setAttribute('class', 'cusnum');
  });
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

  /* LOCAL STORAGE FUNCTION */
  localStoragePrices();
};

/////////////////////
/* EVENT LISTENERS */
/////////////////////
/* CLOSE BUTTON */
checkExitBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('close-win', null);
  }, 300);
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
    pricelistNumber: customerPricelistNumber[customerSearchInput.value.toUpperCase()],
  };
  let monitorFlag = localStorage.getItem('monitorflag');
  /* SEND THE INCORRECT PRICING ARRAY TO THE MAIN PROCESS */
  let pricingObj = {
    localStorageArr,
    curCustomerName: customerName,
    curCustomerNumber: customerSearchInput.value.toUpperCase(),
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

/* CUSTOMER FIND BUTTON */
customerFindBtn.addEventListener('click', (e) => {
  soundClick.play();

  /* CREATE MESSAGE FOR THE POSITION AND CONTENTS OF FIND DOCK */
  let dimensions = customerSearchWindow.getPosition();
  let message = {
    dimensions,
    customerNameNumber,
    customerPrices,
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
/* MINIMIZE */
minimizeBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    customerSearchWindow.minimize();
  }, 300);
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
  delete customerPrices['@EXMILL'];
  /* POPULATE THE LIST WITH THE CUSTOMER NUMBERS */
  fillCustomerPrices();

  customerPricelistNumber = await message.customerPricelistNumber;
  delete customerPricelistNumber['_id'];
});

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
