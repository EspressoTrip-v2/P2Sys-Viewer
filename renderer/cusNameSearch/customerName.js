// Import modules
const { ipcRenderer } = require('electron');

/* GLOBAL VARIABLES */
//////////////////////
let customerNameNumberJson, customerPricesNumbersArr;

///////////////////
/* DOM ELEMENTS */
/////////////////

let customerListContainer = document.getElementById('customer-list-container'),
  searchDock = document.getElementById('customer-search'),
  soundClick = document.getElementById('click'),
  audioTag = Array.from(document.getElementsByTagName('audio')),
  border = document.getElementById('border');

///////////////
/* FUNCTIONS */
///////////////
/* FUNCTION CHECK THE MUTE FLAG */
let storage = JSON.parse(localStorage.getItem('notifications'));
function checkMuteFlag() {
  if (!storage.muteflag) {
    /* SET FLAG TO FALSE AND TURN OFF ALL SOUND */
    storage.muteflag = false;
    localStorage.setItem('notifications', JSON.stringify(storage));
    audioTag.forEach((el) => {
      el.muted = true;
    });
  } else {
    /* SET THE FLAG TO TRUE AND TURN OFF ALL SOUND */
    storage.muteflag = true;
    localStorage.setItem('notifications', JSON.stringify(storage));
    audioTag.forEach((el) => {
      el.muted = false;
    });
  }
}

if (!storage.muteflag) {
  checkMuteFlag();
}

function fillCustomerNameNumberJson() {
  /* POPULATE LIST OF CUSTOMERS */
  ///////////////////////////////

  let customerNames = Object.keys(customerNameNumberJson);
  (() => {
    customerNames.forEach((el) => {
      if (customerPricesNumbersArr.includes(customerNameNumberJson[el.toUpperCase()])) {
        let html = `<div title="${
          customerNameNumberJson[el.toLocaleUpperCase()]
        }" class="customer-name">${el.toUpperCase()}</div>`;
        customerListContainer.insertAdjacentHTML('beforeend', html);
      }
    });
  })();

  ////////////////////////////////////////
  /* DOM ELEMENTS AFTER GENERATED HTML */
  //////////////////////////////////////
  let customerNameLists = Array.from(document.getElementsByClassName('customer-name'));

  //////////////////////
  /* EVENT LISTENERS */
  ////////////////////
  customerNameLists.forEach((el) => {
    el.addEventListener('click', (e) => {
      soundClick.play();
      setTimeout(() => {
        let number = customerNameNumberJson[e.target.innerText];
        // send ipc
        ipcRenderer.send('dock-sec', number);
        ipcRenderer.send('close-window-dock', null);
      }, 300);
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
  border.style.visibility = 'visible';
}

////////////////////////
/* MESSAGE LISTENERS */
//////////////////////

/* POPULATE THE LIST OF NAMES IN WINDOW */
ipcRenderer.on('name-search', (event, message) => {
  customerNameNumberJson = message.customerNameNumberJson;
  customerPricesNumbersArr = message.customerPricesNumbersArr;
  fillCustomerNameNumberJson();
  setTimeout(() => {
    searchDock.focus();
  }, 300);
});

/* MESSAGE TO RETRACT WINDOW BEFORE CLOSE */
ipcRenderer.on('close-window-dock', (e, message) => {
  border.style.visibility = 'hidden';
});
