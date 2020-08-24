/* MODULES */
////////////
const { remote, ipcRenderer, shell } = require('electron');
const { customerPricesModel } = require('../../database/mongoDbConnect');

/* GET WORKING DIRECTORY */
const dir = process.cwd();

/* GET CURRENT WINDOW */
let customerSearchWindow = remote.getCurrentWindow();

/* GLOBAL VARIABLES */
let customerNumberName, customerPrices;

//////////////////
/* DOM ELEMENTS */
//////////////////

let customerFindBtn = document.getElementById('assist-btn'),
  checkExitBtn = document.getElementById('check-exit-btn'),
  checkViewBtn = document.getElementById('check-view-btn'),
  customerSearchInput = document.getElementById('customer-search');

/* EVENT LISTENERS */
checkExitBtn.addEventListener('click', (e) => {
  customerSearchWindow.close();
});

checkViewBtn.addEventListener('click', (e) => {
  console.log(customerPrices);
  console.log(customerNumberName);
});

customerFindBtn.addEventListener('click', (e) => {
  let dimensions = customerSearchWindow.getPosition();
  if (customerSearchWindow.getChildWindows()[0]) {
    customerSearchWindow.getChildWindows()[0].close();
  } else {
    ipcRenderer.send('name-search', dimensions);
  }
});

ipcRenderer.on('database', (e, message) => {
  customerNumberName = message.customerNumberName;
  customerPrices = message.customerPrices;
});
