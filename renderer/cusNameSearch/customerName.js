// Import modules
const { ipcRenderer } = require('electron');

/* GLOBAL VARIABLES */
//////////////////////
let customerNameNumber;

///////////////////
/* DOM ELEMENTS */
/////////////////

let customerListContainer = document.getElementById('customer-list-container'),
  searchDock = document.getElementById('customer-search'),
  soundClick = document.getElementById('click'),
  border = document.getElementById('border');

///////////////
/* FUNCTIONS */
///////////////
function fillCustomerNameNumber() {
  /* POPULATE LIST OF CUSTOMERS */
  ///////////////////////////////

  let customers = Object.keys(customerNameNumber);
  (() => {
    customers.forEach((el) => {
      let html = `<div title="${
        customerNameNumber[el.toLocaleUpperCase()]
      }" class="customer-name">${el.toUpperCase()}</div>`;
      customerListContainer.insertAdjacentHTML('beforeend', html);
    });
  })();
  ////////////////////////////////////////
  /* DOM ELEMENTS AFTER GENERATED HTML */
  //////////////////////////////////////

  let customerNameLists = Array.from(document.getElementsByClassName('customer-name'));

  //////////////////////
  /* EVENT LISTENERS */
  ////////////////////
  /* SEND CUSTOMER NUMBER TO SECWINDOW */
  customerNameLists.forEach((el) => {
    el.addEventListener('click', (e) => {
      soundClick.play();
      let number = customerNameNumber[e.target.innerText];
      // send ipc
      ipcRenderer.send('dock-select', number);

      // Clear any existing highlighted number in case of reclick
      customerNameLists.forEach((el) => {
        el.setAttribute('class', 'customer-name');
      });

      // set the highlight on current clicked item
      el.setAttribute('class', 'customer-name-clicked');
    });
  });

  //////////////////
  /* SEARCH CODE */
  ////////////////

  searchDock.addEventListener('keyup', (e) => {
    searchDock.value = searchDock.value.toUpperCase();
    customerNameLists.forEach((el) => {
      let elMatch = el.innerText.includes(searchDock.value);
      el.style.display = elMatch ? 'block' : 'none';
    });
  });
  setTimeout(() => {
    border.style.transform = 'scaleX(1)';
  }, 300);
}

////////////////////////
/* MESSAGE LISTENERS */
//////////////////////

/* POPULATE THE LIST OF NAMES IN WINDOW */
ipcRenderer.on('name-search', (event, message) => {
  customerNameNumber = message;
  fillCustomerNameNumber();
});

/* MESSAGE TO RETRACT WINDOW BEFORE CLOSE */
ipcRenderer.on('close-window-dock', (e, message) => {
  border.style.transform = 'scaleX(0)';
});
