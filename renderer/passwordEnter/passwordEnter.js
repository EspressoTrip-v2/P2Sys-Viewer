/* MODULES */
////////////
const { ipcRenderer, remote } = require('electron');
const bcrypt = require('bcrypt');

/* GET WORKING DIRECTORY */
let dir;
if (!process.env.NODE_ENV) {
  dir = `${process.cwd()}\\resources\\app.asar`;
} else {
  dir = process.cwd();
}

/* VARIABLES */
let hash;
let passwordEnterWindow = remote.getCurrentWindow();

/* DOM ELEMENTS */
let userInput = document.getElementById('username'),
  userPassword = document.getElementById('password'),
  loginBtn = document.getElementById('login-btn'),
  soundClick = document.getElementById('click'),
  audioTag = Array.from(document.getElementsByTagName('audio')),
  loadingContainer = document.getElementsByClassName('loading-container')[0],
  closeAppBtn = document.getElementById('close-application'),
  header = document.getElementById('header'),
  usernameLabel = document.getElementById('username-label'),
  passwordLabel = document.getElementById('password-label');

/* FUNCTION CHECK THE MUTE FLAG */
function checkMuteFlag() {
  if (localStorage.getItem('muteflag') === 'false') {
    /* SET FLAG TO FALSE AND TURN OFF ALL SOUND */
    audioTag.forEach((el) => {
      el.muted = true;
    });
  } else {
    /* SET THE FLAG TO TRUE AND TURN OFF ALL SOUND */
    audioTag.forEach((el) => {
      el.muted = false;
    });
  }
}

if (localStorage.getItem('muteflag') === 'false') {
  checkMuteFlag();
}

function headerMessage(message, flag) {
  if (flag) {
    header.style.visibility = 'hidden';
    header.innerText = '';
  } else {
    header.style.visibility = 'visible';
    header.innerText = message;
  }
}

function checkCredentials() {
  let username = userInput.value;
  let password = userPassword.value;
  let loginString = `${username}${password}`;
  bcrypt.compare(loginString, hash, (err, result) => {
    if (!result) {
      headerMessage('Invalid user credentials', false);
      hideLoading();
    } else {
      ipcRenderer.send('connect-to-database', { username, password });
      passwordEnterWindow.close();
    }
  });
}

function shortPassword() {
  headerMessage('Invalid user credentials', false);
  passwordLabel.style.color = 'var(--button-red)';
  passwordLabel.innerText = 'Password min length 4.';
}

function shortUsername() {
  headerMessage('Invalid user credentials', false);
  usernameLabel.style.color = 'var(--button-red)';
  usernameLabel.innerText = 'Username min length 4.';
}

function resetLabels() {
  headerMessage('', true);
  passwordLabel.style.color = '#000';
  passwordLabel.innerText = 'Password:';
  usernameLabel.style.color = '#000';
  usernameLabel.innerText = 'Username:';
}

function showLoading() {
  loadingContainer.style.visibility = 'visible';
  closeAppBtn.style.display = 'none';

  loginBtn.style.display = 'none';
}

function hideLoading() {
  loadingContainer.style.visibility = 'hidden';
  closeAppBtn.style.display = 'flex';

  loginBtn.style.display = 'flex';
}

loginBtn.addEventListener('click', (e) => {
  resetLabels();
  soundClick.play();
  setTimeout(() => {
    if (userInput.value.length >= 4 && userPassword.value.length >= 4) {
      showLoading();
      checkCredentials();
    } else if (userInput.value.length < 4) {
      shortUsername();
    } else if (userPassword.value.length < 4) {
      shortPassword();
    }
  }, 300);
});

window.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    loginBtn.click();
  }
});

/* CLOSE APPLICATION BUTTON */
closeAppBtn.addEventListener('click', (e) => {
  soundClick.play();
  setTimeout(() => {
    ipcRenderer.send('close-app', null);
  }, 400);
});

ipcRenderer.on('hash', (e, message) => {
  hash = message;
});
