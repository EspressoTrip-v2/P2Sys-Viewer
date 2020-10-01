/* MODULES */
const { ipcRenderer, remote } = require('electron');

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

/* LOCAL IMPORTS */
const { tablePopulate } = require(`${dir}/renderer/table/tablePopulate.js`);

/* GET CURRENT WINDOW */
let tableWindow = remote.getCurrentWindow();

/* GLOBAL VARIABLES */
let customerNumbervalue, windowState;

/* GET SCREEN SIZE */
let res = remote.screen.getPrimaryDisplay().size;
screenHeight = res.height;
screenWidth = res.width;

// /* GET CALCULATED HEIGHT */
// if (screenHeight > 830) {
//   height = 800;
// } else if (screenHeight <= 830) {
//   height = screenHeight - 80;
// }

//////////////////
/* DOM ELEMENTS */
//////////////////
let table = document.getElementById('table'),
  customerName = document.getElementById('customer-name'),
  customerNumber = document.getElementById('customer-number'),
  border = document.getElementById('border'),
  hideBtn = document.getElementById('hide'),
  unhideBtn = document.getElementById('unhide'),
  minCloseBtn = document.getElementById('close-b'),
  closeBtn = document.getElementById('close'),
  infoBtn = document.getElementById('info'),
  soundClick = document.getElementById('click'),
  customerNameContainer = document.getElementById('customer-name-container'),
  tableContainer = document.getElementsByClassName('table-container')[0],
  shrunkContainer = document.getElementById('shrunk-container'),
  minLogoBar = document.getElementById('min-logo'),
  Container = document.getElementById('container'),
  logoCircle = document.getElementById('logo-circle'),
  grabMessageContainer = document.getElementById('grab-message-container');

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
  border.style.opacity = '1';
}

/* POPULATE THE TABLE WITH THE SELECTED CUSTOMER */
function fillTable(json) {
  let generatedHtml = tablePopulate(json);
  htmlInnerFill(generatedHtml);
}

/////////////////////
/* EVENT LISTENERS */
/////////////////////

function infoButtonClick() {
  setTimeout(() => {
    /* CHECK TO SEE IF CONTAINER IS SCALE(0) */
    if (
      window.getComputedStyle(customerNameContainer).transform === 'matrix(1, 0, 0, 0, 0, 0)'
    ) {
      customerNameContainer.style.transform = 'scaleY(1)';
    } else {
      customerNameContainer.style.transform = 'scaleY(0)';
    }
  }, 200);
}

/* INFO BUTTON */
infoBtn.addEventListener('click', (e) => {
  soundClick.play();
  infoButtonClick();
});

/* CLOSE BUTTON */
closeBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    tableWindow.close();
  }, 200);
});

/* HIDE BUTTON */
hideBtn.addEventListener('click', (e) => {
  /* HIDE THE INFO DROPDOWN IF OPEN */
  if (
    window.getComputedStyle(customerNameContainer).transform === 'matrix(1, 0, 0, 1, 0, 0)'
  ) {
    infoButtonClick();
  }
  /* GET THE WINDOW SIZE FOR WHEN UNHIDING */
  windowState = tableWindow.getSize();
  soundClick.play();
  setTimeout(() => {
    /* SCROLLS THE TABLE DOWN TO STOP FREEZING ON UNHIDE */
    if (window.getComputedStyle(tableContainer).transform === 'matrix(1, 0, 0, 1, 0, 0)') {
      Container.scrollTo(0, windowState[1]);
      tableContainer.style.transform = 'scaleY(0)';
      setTimeout(() => {
        border.style.transform = 'scaleX(0)';
      }, 300);
    }
    /* SET WINDOW SIZE */
    setTimeout(() => {
      tableWindow.setSize(180, 80);

      setTimeout(() => {
        shrunkContainer.style.visibility = 'visible';
        shrunkContainer.style.opacity = '1';
        logoCircle.style.transform = 'rotate(360deg)';
        setTimeout(() => {
          minLogoBar.style.transform = 'scaleX(1)';
          grabMessageContainer.style.animation = 'flash 1s linear 4';
        }, 300);
      }, 500);
    }, 500);
  }, 200);
});

unhideBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    grabMessageContainer.style.animation = 'none';
    minLogoBar.style.transform = 'scaleX(0)';
    setTimeout(() => {
      logoCircle.style.transform = 'rotate(0)';

      shrunkContainer.style.opacity = '0';
      setTimeout(() => {
        shrunkContainer.style.visibility = 'hidden';
        tableWindow.setSize(380, windowState[1]);
        setTimeout(() => {
          border.style.transform = 'scaleX(1)';
          setTimeout(() => {
            tableContainer.style.transform = 'scaleY(1)';
            /* SCROLLS TABLE TO TOP TO STOP FREEZING BUG */
            Container.scrollTo(0, 0);
          }, 200);
        }, 200);
      }, 300);
    }, 300);
  }, 200);
});

/* CLOSE BUTTON MINI BAR */
minCloseBtn.addEventListener('click', (e) => {
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
  /* SET TITLE OF BAR */
  minLogoBar.title = message.customerName;
});
