var singleValue = 0;

exports.testFunction = () => {
  return "test";
};

exports.getDirectory = () => {
  // @ts-ignore
  return __dirname;
};

exports.getFileName = () => {
  // @ts-ignore
  return __filename;
};

exports.setSingleValue = (value) => {
  singleValue = value;
};

exports.getSingleValue = () => {
  return singleValue;
};

exports.getModule = () => {
  // @ts-ignore
  return module;
};

exports.getValueFromNestedModule = () => {
  const nestedModule = require("./test-modules/test-module-01");
  return nestedModule.getValue12Plus17();
};
