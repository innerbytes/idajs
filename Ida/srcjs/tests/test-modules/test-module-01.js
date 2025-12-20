const module02 = require("./test-module-02");

const getValue17 = module02.getValue17;

const getValue12 = function () {
  return 12;
};

exports.getValue12Plus17 = function () {
  return getValue12() + getValue17();
};

exports.getValueFromUpperPathModule = function () {
  const upperPathModule = require("../tests.module2.js");
  return upperPathModule.getValue42();
};

exports.getValueFromWindowsUpperPathModule = function () {
  const upperPathModule = require("..\\tests.module2.js");
  return upperPathModule.getValue42();
};
