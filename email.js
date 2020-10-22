/* MODULES */
const nodemailer = require('nodemailer');
const { Notification } = require('electron');

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

/////////////////////////////////////
/* INCORRECT PRICING MAIL FUNCTION */
/////////////////////////////////////

exports.sendMail = async (typemail, customername, customernumber, itemno, pricesys, price) => {
  let text, subject;
  /* CREATE NODEMAILER TRANSPORTER */
  let mailTransportObject = {
    host: process.env.EMAIL_SMTP_HOST,
    auth: {
      user: process.env.EMAIL_AUTH_USER,
      pass: process.env.EMAIL_AUTH_PASSWORD,
    },
  };

  if (typemail) {
    text = `IMPORTANT VIEWER NOTIFICATION!\n\nThis is an automated notification email.\n\nViewer has noticed during order creation that the Sage system price-list for ${customername} does not match the price on file.\n\nLast item entered ${itemno}:\n Sage Price = R${pricesys}\nViewer Price =  R${price}\n\nPlease urgently correct the pricing to avoid any errors in the future.\n\nKind regards,\nP2Sys Team.`;
    subject = `INCORRECT PRICING FOR ${customernumber}`;
  } else {
    text = `IMPORTANT VIEWER NOTIFICATION!\n\nThis is an automated notification email.\n\nViewer has encountered an error during order creation for ${customername}. It seems there is no Sage price-list allocated to customer number ${customernumber}, else Sage had an error processing the request.\n\nIf the problem has already been resolved, please ignore this notification.\n\nKind regards,\nP2Sys Team.`;
    subject = `PRICE LIST ERROR ${customernumber}`;
  }

  let message = {
    from: 'pricing@acwhitcher.co.za',
    to: process.env.EMAIL_TO,
    subject,
    text,
  };

  /* CREATE NODEMAILER TRANSPORTER */
  let mailTransport = nodemailer.createTransport(mailTransportObject);

  let notification = new Notification({
    title: 'PRICING NOTIFICATION SENT',
    body: `Notification about pricing for ${customername} has been sent for review.`,
    icon: `${dir}/renderer/icons/info.png`,
  });
  mailTransport.sendMail(message, (err, info) => {
    notification.show();
  });
};
