const encodeMap = new Map();
var encoding = null;
var restrictedAscii = null;

function setEncoding(enc, noAscii) {
  encoding = enc;
  restrictedAscii = noAscii;
}

function loadEncoding() {
  encodeMap.clear();
  for (const item of encoding) {
    encodeMap.set(item.key, item.val);
  }
}

function encodeString(textValue, omitPrepareLineBreaks = false) {
  if (encodeMap.size === 0) {
    loadEncoding();
  }

  if (!omitPrepareLineBreaks) {
    textValue = textValue.replaceAll("\n", " \n");
  }

  var result = new Uint8Array(textValue.length);
  var index = 0;
  const fallbackCharCode = 46; // dot

  for (let i = 0; i < textValue.length; i++) {
    var charCode = textValue.charCodeAt(i);

    if (charCode >= 32 && charCode <= 126) {
      if (restrictedAscii.has(charCode)) {
        charCode = fallbackCharCode;
      }

      result[index++] = charCode;
      continue;
    }

    var char = textValue[i];
    charCode = encodeMap.get(char);
    if (charCode === undefined) {
      charCode = fallbackCharCode;
    }
    result[index++] = charCode;
  }

  return result;
}

module.exports = {
  setEncoding,
  encodeString,
};
