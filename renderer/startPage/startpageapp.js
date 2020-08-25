/* MODULES */
////////////
const { remote, ipcRenderer, shell } = require('electron');
const { customerPricesModel } = require('../../database/mongoDbConnect');

/* GET WORKING DIRECTORY */
const dir = process.cwd();
/* GET CURRENT DIR */
const curDir = __dirname;

/* GET CURRENT WINDOW */
let customerSearchWindow = remote.getCurrentWindow();

/* GLOBAL VARIABLES */
let customerNumberName, customerPrices, customerNameNumber;

//////////////////
/* DOM ELEMENTS */
//////////////////

let customerFindBtn = document.getElementById('assist-btn'),
  checkExitBtn = document.getElementById('check-exit-btn'),
  checkViewBtn = document.getElementById('check-view-btn'),
  checkDisabledBtn = document.getElementById('disabled'),
  customerSearchInput = document.getElementById('customer-search'),
  customerNumberList = document.getElementById('customer-list'),
  soundClick = document.getElementById('click');

///////////////
/* FUNCTIONS */
///////////////

/////////////////////////////////
/* CUSTOMER NUMBER SEARCH BOX */
///////////////////////////////

function fillCustomerPrices() {
  /* CLEAR CURRENT LIST OF CLICKS FUNCTION */
  function clearList() {
    numbersDivItems.forEach((el) => {
      el.setAttribute('class', 'cusnum');
    });
  }

  let numbersDivItems;
  function addListListeners() {
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
  }

  /* POPLATE THE CUSTOMERLIST AND ADD CORRECT CLASSES */
  (function populateList() {
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
    }
  });
}

/////////////////////
/* EVENT LISTENERS */
/////////////////////
checkExitBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    customerSearchWindow.close();
  }, 200);
});

checkViewBtn.addEventListener('click', (e) => {
  soundClick.play();
  /* ADD POPULATION CODE FOR TABLE */
});

customerFindBtn.addEventListener('click', (e) => {
  soundClick.play();
  customerSearchInput.value = '';
  customerSearchInput.dispatchEvent(new Event('keyup'));
  let dimensions = customerSearchWindow.getPosition();
  let message = {
    dimensions,
    customerNameNumber,
  };

  if (customerSearchWindow.getChildWindows()[0]) {
    customerSearchWindow.getChildWindows()[0].close();
    customerSearchInput.focus();
  } else {
    ipcRenderer.send('name-search', message);
  }
});

ipcRenderer.on('database', async (e, message) => {
  customerNumberName = await message.customerNumberName;
  delete customerNumberName['_id'];
  customerNameNumber = {};
  Object.entries(customerNumberName).forEach((el) => {
    customerNameNumber[el[1]] = el[0];
  });
  customerPrices = await message.customerPrices;
  delete customerPrices['_id'];
  fillCustomerPrices(customerPrices, customerSearchInput, customerNumberList);
});

/* IPC LISTENERS */
ipcRenderer.on('dock-select', (e, message) => {
  /* CLEAR THE INPUT DISPATCH KEYUP EVENT TO REMOVE ANY BACKGROUND */
  customerSearchInput.value = '';
  customerSearchInput.dispatchEvent(new Event('keyup'));

  /* FOCUS SEARCH FIELD AND INSERT CLICKED CYUSTOMER NUMBER */
  customerSearchInput.focus();
  customerSearchInput.value = message;
  customerSearchInput.dispatchEvent(new Event('keyup'));
});
