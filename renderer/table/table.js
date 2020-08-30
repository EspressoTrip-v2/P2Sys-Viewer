/* MODULES */
const { ipcRenderer, remote } = require('electron');
const { set } = require('mongoose');

/* GET WORKING DIRECTORY */
let dir;
function envFileChange() {
  let fileName = `${process.cwd()}/resources/app.asar`;
  /* LOCAL MODULES */
  if (process.platform === 'win32') {
    let pattern = /[\\]+/g;
    dir = fileName.replace(pattern, '/');
  }
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

/* LOCAL IMPORTS */
const { tablePopulate } = require(`${dir}/renderer/table/tablePopulate.js`);

/* GET CURRENT WINDOW */
let tableWindow = remote.getCurrentWindow();

/* GET SCREEN SIZE */
let res = remote.screen.getPrimaryDisplay().size;
screenHeight = res.height;
screenWidth = res.width;
//////////////////
/* DOM ELEMENTS */
//////////////////
let table = document.getElementById('table'),
  customerName = document.getElementById('customer-name'),
  customerNumber = document.getElementById('customer-number'),
  narrowBtn = document.getElementById('narrow'),
  tableCloseBtn = document.getElementById('close'),
  /* DOCK */
  dockCloseBtn = document.getElementById('dock-hide-close'),
  border = document.getElementById('border'),
  dockHideExpandBtn = document.getElementById('dock-hide-expand'),
  soundClick = document.getElementById('click'),
  dockButtonContainer = document.getElementById('button-container');

/* GLOBAL VARIABLES */
let customerNumbervalue;
///////////////
/* FUNCTIONS */
///////////////

/* INNER TABLE HTM FUNCTION */
function htmlInnerFill(html) {
  let innerTableColumns = html.htmlColumns,
    innerTable = html.htmlInner;

  table.insertAdjacentHTML(
    'beforeend',
    `<tbody id="table-body" ><tr id="row-columns">${innerTableColumns}</tr>${innerTable}</tbody>`
  );
}

/* POPULATE THE TABLE WITH THE SELECTED CUSTOMER */
function fillTable(json) {
  let generatedHtml = tablePopulate(json);
  htmlInnerFill(generatedHtml);
}

/* DOCK HIDE FUNCTION */
function dockHide() {
  let size = tableWindow.getSize();
  if (size[0] === 65) {
    dockButtonContainer.style.transform = 'translateX(-70px)';
    setTimeout(() => {
      tableWindow.setSize(550, size[1]);
      setTimeout(() => {
        border.style.transform = 'scaleX(1)';
      }, 200);
    }, 500);
  } else if (size[0] === 550) {
    dockButtonContainer.setAttribute('customer-number', customerNumbervalue);
    border.style.transform = 'scaleX(0)';
    setTimeout(() => {
      tableWindow.setSize(65, size[1]);
      setTimeout(() => {
        dockButtonContainer.style.transform = 'translateX(0px)';
      }, 200);
    }, 500);
  }
}
/////////////////////
/* EVENT LISTENERS */
/////////////////////

/* DOCK NARROW BUTTON */
narrowBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    dockHide();
  }, 200);
});

dockHideExpandBtn.addEventListener('click', () => {
  soundClick.play();
  dockHide();
});

/* CLOSE BUTTONS */
tableCloseBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    tableWindow.close();
  }, 200);
});

dockCloseBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    tableWindow.close();
  }, 200);
});

///////////////////
/* IPC LISTENERS */
///////////////////

ipcRenderer.on('table-window', (e, message) => {
  fillTable(message.jsonFile);
  customerName.innerText = message.customerName;
  customerNumber.innerText = message.customerNumber;
  customerNumbervalue = message.customerNumber;
});
