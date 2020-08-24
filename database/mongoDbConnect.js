/* MODULES */
const mongoose = require('mongoose');

/* CUSTOMER PRICELISTS ALREADY CREATED */
/* SCHEMA */
const customerPricesSchema = new mongoose.Schema(
  {},
  { strict: false, _id: false, versionKey: false }
);
/* MODEL */
const customerPricesModel = mongoose.model('Customer_Prices', customerPricesSchema);
exports.customerPricesModel = customerPricesModel;

/* CUSTOMER NAME: CUSTOMER NUMBER */
/* SCHEMA */
const customerNumberNameSchema = new mongoose.Schema(
  {},
  { strict: false, _id: false, versionKey: false }
);
/* MODEL */
const customerNumberNameModel = mongoose.model(
  'Customer_Number_Name',
  customerNumberNameSchema
);
exports.customerNumberNameModel = customerNumberNameModel;
