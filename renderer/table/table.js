'use strict';
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
let customerNumbervalue, productObject, productValue, windowState, priceListNumber;

/* CREATE ROW LOOKUP FOR PRODUCT NUMBERS */
let productDict = {
  R0: '038038',
  R1: '038038',
  R2: '038038',

  R3: '038050',
  R4: '038050',
  R5: '038050',

  R6: '038076',
  R7: '038076',
  R8: '038076',

  R9: '038114',
  R10: '038114',
  R11: '038114',

  R12: '038152',
  R13: '038152',
  R14: '038152',

  R15: '038228',
  R16: '038228',
  R17: '038228',

  R18: '050076',
  R19: '050076',
  R20: '050076',

  R21: '050152',
  R22: '050152',
  R23: '050152',

  R24: '050228',
  R25: '050228',
  R26: '050228',

  R27: '076228',
  R28: '076228',
  R29: '076228',
};

//////////////////
/* DOM ELEMENTS */
//////////////////
let table = document.getElementById('table'),
  customerName = document.getElementById('customer-name'),
  customerNumber = document.getElementById('customer-number'),
  border = document.getElementById('border'),
  closeBtn = document.getElementById('close'),
  infoBtn = document.getElementById('info'),
  soundClick = document.getElementById('click'),
  customerNameContainer = document.getElementById('customer-name-container'),
  tableContainer = document.getElementsByClassName('table-container')[0],
  shrunkContainer = document.getElementById('shrunk-container'),
  Container = document.getElementById('container'),
  logoCircle = document.getElementById('logo-circle'),
  copyPopup = document.getElementById('copied'),
  itemNoPopup = document.getElementById('product-itemno-popup'),
  itemNoList = document.getElementById('itemno'),
  blurItemNo = document.getElementById('blur'),
  keysInfo = document.getElementById('keys'),
  soundPopup = document.getElementById('pop'),
  soundNotify = document.getElementById('notify'),
  typeFlagText = document.getElementById('type-flag'),
  audioTag = Array.from(document.getElementsByTagName('audio'));

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

/* CLOSE FUNCTION FOR SLECTION POPUP */
function selectionPopUpClose() {
  itemNoPopup.close();
  blurItemNo.style.visibility = 'hidden';
  keysInfo.style.display = 'none';
  itemNoAddListener(false);
  itemNoList.innerHTML = '';
}

/* EVENTLISTENER FUNCTION FOR ITEMNO LIST */
function itemNoEventListener(e) {
  soundClick.play();
  /* CREATE THE ITEM OBJECT TO SEND TO PASTE SHORTCUTS */
  let itemMessage = {
    itemNo: e.target.title,
    itemValue: productValue,
    itemPricelist: priceListNumber,
  };
  ipcRenderer.send('paste-variables', itemMessage);
  selectionPopUpClose();
  setTimeout(() => {
    soundNotify.play();
    copyPopup.show();
  }, 300);
  setTimeout(() => {
    copyPopup.close();
  }, 1000);
}

/* ADD EVENT LISTENER TO ITEMNO LIST */
function itemNoAddListener(add = true) {
  let item = Array.from(document.getElementsByClassName('size'));
  if (add) {
    item.forEach((el) => {
      el.addEventListener('click', itemNoEventListener);
    });
  } else {
    item.forEach((el) => {
      el.removeEventListener('click', itemNoEventListener);
    });
  }
}

/* POPULATE SELECTION LIST ITEMNO FUNCTION */
function populateItemlist(stringArr, dimensions, intArr) {
  let html = '';
  for (let i = 0; i <= intArr.length - 1; i++) {
    let description = `${dimensions} X ${intArr[i]}`;
    html += `<div class="size" title="${stringArr[i]}">${description}</div>`;
  }
  itemNoList.insertAdjacentHTML('beforeend', html);
  itemNoAddListener();
  if (typeFlag) {
    typeFlagText.innerText = 'Treated';
    typeFlagText.style.backgroundColor = 'var(--button-gold)';
  } else {
    typeFlagText.innerText = 'Untreated';
    typeFlagText.style.backgroundColor = 'var(--sec-blue)';
  }
  blurItemNo.style.visibility = 'visible';
  keysInfo.style.display = 'flex';
  setTimeout(() => {
    soundPopup.play();
    itemNoPopup.show();
  }, 300);
}

/* CONVERT TO LENGTH RANGE AND CREATE AND TURN INTO STRING */
function makeRangeString(idCell, arr, type, and = [], excl = [], odds = false) {
  /* GET THE SIZES FROM THE THE PRODUCT DICTIONARY */
  let productRange = productDict[idCell];
  /* GET THE ITEMNOS ON DATABASE */
  let itemNo = productObject[productRange.slice(0, 3)][type];
  let itemNoStringArr = [],
    intLength = [];

  /* RUN ONLY IF PRODUCTS ARE NOT ODDS OR EVENS */
  if (!odds) {
    /* CREATE RANGE OF SIZES IN 300 INCREMENTS*/
    for (let i = arr[0]; i <= arr[arr.length - 1]; i += 300) {
      let iString = i.toString();
      if (iString.length < 4) {
        iString = '0' + iString;
      }
      /* CONVERT TO A STRING TO USE FOR CHECKING PRODUCT NUMBERS */
      /* LOOP THROUGH ITEMNO AND STORE THOSE REQUIRED */
      let number = `${productRange}${iString}`;
      itemNo.forEach((el) => {
        if (el.includes(number)) {
          itemNoStringArr.push(el);
          intLength.push(i);
        }
      });
    }
    if (and.length > 0) {
      and.forEach((andel) => {
        let andNumber = `${productRange}${andel}`;
        itemNo.forEach((el) => {
          if (el.includes(andNumber)) {
            itemNoStringArr.push(el);
            intLength.push(andel);
          }
        });
      });
    }

    if (excl.length > 0) {
      excl.forEach((exclel) => {
        let exclNumber = `${productRange}${exclel}`;
        /* REMOVE TEH LENGTHS FROM THE INT ARRAY */
        let idxInt = intLength.indexOf(exclel);
        if (idxInt !== -1) {
          intLength.splice(idxInt, 1);
        }
        /* REMOVE THE PRODUCT NUMBERS FROM THE LENGHT ARRAY */
        itemNo.forEach((el) => {
          if (el.includes(exclNumber)) {
            let idx = itemNoStringArr.indexOf(el);
            if (idx !== -1) {
              itemNoStringArr.splice(idx, 1);
            }
          }
        });
      });
    }

    return [itemNoStringArr, intLength];

    /* IF ODDS OR EVENS RUN THIS */
  } else {
    arr.forEach((arrel) => {
      let number = `${productRange}${arrel}`;
      itemNo.forEach((el) => {
        if (el.includes(number)) {
          itemNoStringArr.push(el);
          intLength.push(arrel);
        }
      });
    });
    return [itemNoStringArr, intLength];
  }
}

/* CONVERT LENGTHS TO INTEGER VALUES */
function convertToInt(arr) {
  let convArr = [];
  arr.forEach((el) => {
    convArr.push(parseFloat(el) * 1000);
  });
  return convArr;
}

/* PARSE THE SELECTED CELL TO EXTRACT LENGTHS */
function parseItemNo(element) {
  let lengths,
    type,
    patternA = /(\d.\d)/g,
    patternB = /(AND)/g,
    patternC = /(EXCL)/g,
    patternOdd = /(ODD LENGTHS)/g,
    patternEven = /(EVEN LENGTHS)/g;

  /* EXTRACT LENGTHS FROM ELEMENT INNERTEXT */
  /* GET PARENT */
  let parent = element.parentNode.parentNode,
    productStringArr;
  let dimensionElementText = document.getElementById(`D${parent.id}`).innerText;
  let lengthEntry = parent.getElementsByClassName('table-entries')[0].innerText;
  lengths = convertToInt(lengthEntry.match(patternA));
  /* TEST PATTERNS */
  if (patternB.test(lengthEntry)) {
    type = 'and';
  } else if (patternC.test(lengthEntry)) {
    type = 'excl';
  } else if (patternEven.test(lengthEntry)) {
    type = 'even';
  } else if (patternOdd.test(lengthEntry)) {
    type = 'odd';
  } else {
    /* STANDARD LENGTHS */

    /* CHECK FROM WHAT PRICING ITS FROM */
    if (element.id.includes('TSER')) {
      productStringArr = makeRangeString(parent.id, lengths, 'treated');
      populateItemlist(productStringArr[0], dimensionElementText, productStringArr[1]);
    } else if (element.id.includes('USER')) {
      productStringArr = makeRangeString(parent.id, lengths, 'untreated');
      populateItemlist(productStringArr[0], dimensionElementText, productStringArr[1]);
    }
  }
  /* INCLUDING LENGTHS */
  if (type === 'and') {
    let incl = [...lengths].splice(2);
    lengths = lengths.slice(0, 2);

    /* CHECK FROM WHAT PRICING ITS FROM */
    if (element.id.includes('TSER')) {
      productStringArr = makeRangeString(parent.id, lengths, 'treated', incl);
      populateItemlist(productStringArr[0], dimensionElementText, productStringArr[1]);
    } else if (element.id.includes('USER')) {
      productStringArr = makeRangeString(parent.id, lengths, 'untreated', incl);
      populateItemlist(productStringArr[0], dimensionElementText, productStringArr[1]);
    }

    /* EXCLUDING LENGTHS */
  } else if (type === 'excl') {
    let excl = [...lengths].splice(2);
    lengths = lengths.slice(0, 2);

    /* CHECK FROM WHAT PRICING ITS FROM */
    if (element.id.includes('TSER')) {
      productStringArr = makeRangeString(parent.id, lengths, 'treated', [], excl);
      populateItemlist(productStringArr[0], dimensionElementText, productStringArr[1]);
    } else if (element.id.includes('USER')) {
      productStringArr = makeRangeString(parent.id, lengths, 'untreated', [], excl);
      populateItemlist(productStringArr[0], dimensionElementText, productStringArr[1]);
    }

    /* ODD LENGTHS */
  } else if (type === 'odd') {
    let lengthArr = [2700, 3300, 3900, 4500, 5100, 5700];

    /* CHECK FROM WHAT PRICING ITS FROM */
    if (element.id.includes('TSER')) {
      productStringArr = makeRangeString(parent.id, lengthArr, 'treated', [], [], true);
      populateItemlist(productStringArr[0], dimensionElementText, productStringArr[1]);
    } else if (element.id.includes('USER')) {
      productStringArr = makeRangeString(parent.id, lengthArr, 'untreated', [], [], true);
      populateItemlist(productStringArr[0], dimensionElementText, productStringArr[1]);
    }

    /* EVEN LENGTHS */
  } else if (type === 'even') {
    let lengthArr = [3000, 3600, 4200, 4800, 5400];

    /* CHECK FROM WHAT PRICING ITS FROM */
    if (element.id.includes('TSER')) {
      productStringArr = makeRangeString(parent.id, lengthArr, 'treated', [], [], true);
      populateItemlist(productStringArr[0], dimensionElementText, productStringArr[1]);
    } else if (element.id.includes('USER')) {
      productStringArr = makeRangeString(parent.id, lengthArr, 'untreated', [], [], true);
      populateItemlist(productStringArr[0], dimensionElementText, productStringArr[1]);
    }
  }
}

/* ADD EVENT LISTENERS TO COPY VALUES */
/* CREATE TYPE FLAG FOR POPUP INDICATION */
let typeFlag;
function eventListenerAdd() {
  let priceEntriesUntreated = Array.from(
      document.getElementsByClassName('price-entries-untreated')
    ),
    priceEntriesTreated = Array.from(document.getElementsByClassName('price-entries-treated'));

  /* UNTREATED ENTRIES */
  priceEntriesUntreated.forEach((el) => {
    el.addEventListener('click', (e) => {
      /* SET FLAG */
      typeFlag = false;
      /* SET PRODUCT VALUE */
      productValue = e.target.innerText;
      soundClick.play();
      /* RESET ROWS */
      priceEntriesUntreated.forEach((el) => {
        el.parentNode.parentNode.setAttribute('class', 'tr-standard');
      });
      let parent = e.target.parentNode.parentNode;
      /* COLOR ROW WITH SELECTED TYPE */
      parent.setAttribute('class', 'tr-selected-untreated');
      /* PARSE THE LENGTHS */
      parseItemNo(e.target);
    });
  });
  /* TREATED ENTRIES */
  priceEntriesTreated.forEach((el) => {
    el.addEventListener('click', (e) => {
      /* SET FLAG */
      typeFlag = true;
      /* SET PRODUCT VALUE */
      productValue = e.target.innerText;
      soundClick.play();
      /* RESET ROWS */
      priceEntriesTreated.forEach((el) => {
        el.parentNode.parentNode.setAttribute('class', 'tr-standard');
      });
      let parent = e.target.parentNode.parentNode;
      /* COLOR ROW WITH SELECTED TYPE */
      parent.setAttribute('class', 'tr-selected-treated');
      /* PARSE THE LENGTHS */
      parseItemNo(e.target);
    });
  });
}

/* POPULATE THE TABLE WITH THE SELECTED CUSTOMER */
function fillTable(json) {
  let generatedHtml = tablePopulate(json);
  htmlInnerFill(generatedHtml);
  eventListenerAdd();
  ipcRenderer.send('global-shortcuts-register', null);
  tableWindow.focus();
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
  ipcRenderer.send('global-shortcuts-unregister', null);
  ipcRenderer.send('reset-flags', null);
  setTimeout(() => {
    tableWindow.close();
  }, 200);
});

/* HIDE BUTTON */
window.addEventListener('blur', (e) => {
  if (!itemNoPopup.open) {
    /* HIDE THE INFO DROPDOWN IF OPEN */
    if (
      window.getComputedStyle(customerNameContainer).transform === 'matrix(1, 0, 0, 1, 0, 0)'
    ) {
      infoButtonClick();
    }
    setTimeout(() => {
      /* SCROLLS THE TABLE DOWN TO STOP FREEZING ON UNHIDE */
      if (window.getComputedStyle(tableContainer).transform === 'matrix(1, 0, 0, 1, 0, 0)') {
        /* GET THE WINDOW SIZE FOR WHEN UNHIDING */
        windowState = tableWindow.getSize();
        Container.scrollTo(0, [windowState[1]]);
        tableContainer.style.transform = 'scaleY(0)';
        setTimeout(() => {
          border.style.transform = 'scaleX(0)';
        }, 300);
      }
      /* SET WINDOW SIZE */
      setTimeout(() => {
        tableWindow.setSize(70, 70);
        setTimeout(() => {
          shrunkContainer.style.visibility = 'visible';
          shrunkContainer.style.opacity = '1';
          logoCircle.style.transform = 'rotate(360deg)';
        }, 500);
      }, 500);
    }, 200);
  }
});

logoCircle.addEventListener('mouseover', (e) => {
  logoCircle.style.transform = 'rotate(0)';
  shrunkContainer.style.opacity = '0';
  setTimeout(() => {
    shrunkContainer.style.visibility = 'hidden';
    tableWindow.setSize(windowState[0], windowState[1]);
    setTimeout(() => {
      border.style.transform = 'scaleX(1)';
      setTimeout(() => {
        tableContainer.style.transform = 'scaleY(1)';
        /* SCROLLS TABLE TO TOP TO STOP FREEZING BUG */
        Container.scrollTo(0, 0);
      }, 200);
    }, 200);
  }, 300);
});

/* LISTEN FOR ESCAPE KEY TO CLOSE SELE POPUP */
window.addEventListener('keyup', (e) => {
  if (e.key === 'Escape' && itemNoPopup.open) {
    selectionPopUpClose();
  }
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
  // minLogoBar.title = customerName.innerText;
  priceListNumber = message.priceListNumber;
  /* SEND THE CUSTOMER NUMBER TO BE EVALUATED FOR DEFAULT PRICELIST */
  ipcRenderer.send('default-price', customerNumber.innerText);
});

/* MESSAGE PRODUCT NUMBER VARIABLES */
ipcRenderer.on('products', (e, message) => {
  productObject = {
    '038': {
      treated: message.s5038Treated,
      untreated: message.s5038Untreated,
    },
    '050': {
      treated: message.s5050Treated,
      untreated: message.s5050Untreated,
    },
    '076': {
      treated: message.s5076Treated,
      untreated: message.s5076Untreated,
    },
  };
});

/* MUTE ALL AUDIO MESSAGE */
ipcRenderer.on('mute-all', (e, message) => {
  if (message) {
    audioTag.forEach((el) => {
      el.muted = true;
    });
  } else {
    audioTag.forEach((el) => {
      el.muted = false;
    });
  }
});
