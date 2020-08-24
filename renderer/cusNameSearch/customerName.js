// Import modules
const { remote, ipcRenderer } = require('electron');

/* GET WORKING DIRECTORY */
const dir = process.cwd();

/* LOCAL MODULES */
const { customerNameNumber } = require(`${dir}/data/objects.js`);

////////////////////////
/* MESSAGE LISTENERS */
//////////////////////

ipcRenderer.on('child-main', (event, message) => {
  console.log(message);
});

////////////////
/* FUNCTIONS */
//////////////

function addLoader(parent) {
  let html = `
    <div id="loader">
    <img  src="${dir}/renderer/icons/loader.png"/>
    </div>
    `;
  parent.insertAdjacentHTML('beforeend', html);
}

function removeLoader(parent) {
  setTimeout(() => {
    parent.remove();
  }, 5000);
}

//////////////
/* GLOBALS */
////////////
let customerNameListHTML;

///////////////////
/* DOM ELEMENTS */
/////////////////

let customerListContainer = document.getElementById('customer-list-container');

/* POPULATE LIST OF CUSTOMERS */
///////////////////////////////

// Insert spinning logo
// addLoader(customerListContainer);

let customers = Object.keys(customerNameNumber);

(async () => {
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

let customerNameLists = Array.from(document.getElementsByClassName('customer-name')),
  searchDock = document.getElementById('customer-search');

//////////////////////
/* EVENT LISTENERS */
////////////////////
/* SEND CUSTOMER NUMBER TO SECWINDOW */
customerNameLists.forEach((el) => {
  el.addEventListener('click', (e) => {
    let number = customerNameNumber[e.target.innerText];
    // send ipc
    ipcRenderer.send('dock-sec', number);

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
