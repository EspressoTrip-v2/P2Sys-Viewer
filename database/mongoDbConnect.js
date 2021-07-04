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

/* CUSTOMER NUMBER: PRICELIST NUMBER */
/* SCHEMA */
const customerPricelistNumberSchema = new mongoose.Schema(
  {},
  { strict: false, _id: false, versionKey: false }
);
/* MODEL */
const customerPricelistNumberModel = mongoose.model(
  'Customer_Pricelist_Number',
  customerPricelistNumberSchema
);
exports.customerPricelistNumberModel = customerPricelistNumberModel;

// QUERY ALL CUSTOMER PRICE-LIST NUMBERS
exports.queryAllPriceListNumbers = async function (notifyMain) {
  try {
    let result = await customerPricesModel.find().distinct('_id').exec();
    return result;
  } catch (err) {
    logFileFunc(err.stack);
    notifyMain({
      title: 'Query all price list numbers failed',
      body: 'Problem querying all price list numbers, please check the log file.',
    });
  }
};

// QUERY A SINGLE PRICE-LIST
exports.querySinglePriceList = async function (customerNumber, notifyMain) {
  try {
    let priceList = await customerPricesModel.findById(customerNumber).lean().exec();
    return priceList;
  } catch (err) {
    logFileFunc(err.stack);
    notifyMain({
      title: 'Query single price failed',
      body: `Problem querying ${customerNumber} price list, please check the log file.`,
    });
  }
};

// GET CUSTOMER NAME
exports.queryCustomerName = async function (customerNumber, allNames, notifyMain) {
  let result;
  if (allNames) {
    try {
      result = await customerNumberNameModel.find().lean().exec();
      return result;
    } catch (err) {
      logFileFunc(err.stack);
      notifyMain({
        title: 'Querying all customer names failed',
        body: `Problem querying all customer names, please check the log file.`,
      });
    }
  } else {
    try {
      result = await customerNumberNameModel.findById(customerNumber).lean().exec();
      return result;
    } catch (err) {
      logFileFunc(err.stack);
      notifyMain({
        title: 'Querying a customer name failed',
        body: `Problem querying name for ${customerNumber}, please check the log file.`,
      });
    }
  }
};

/* QUERY SINGLE PRICE-LIST NUMBER */
exports.querySinglePriceListNumber = async function (customerNumber, notifyMain) {
  try {
    let result = await customerPricelistNumberModel.findById(customerNumber).lean().exec();
    if (result !== null) {
      return result.number;
    } else {
      return null;
    }
  } catch (err) {
    logFileFunc(err.stack);
    notifyMain({
      title: 'Querying price list number failed',
      body: `Problem querying ${customerNumber} price list, please check the log file.`,
    });
  }
};
