// Restricted ASCII characters that are not supported by the LBA font
const restrictedAscii = new Set([
  42, // *
  43, // +
  60, // <
  61, // =
  62, // >
  91, // [
  92, // \
  93, // ]
  94, // ^
  96, // `
  123, // {
  124, // |
  125, // }
  126, // ~
  127, // DEL
]);

module.exports.restrictedAscii = restrictedAscii;

// LBA2 encoding map, that matches the LBA2 standard font
module.exports.encoding = [
  // Lower characters
  { key: "\n", val: 1 }, // hex: 0x01 - LBA line break
  { key: "←", val: 8 }, // hex: 0x08
  { key: "✓", val: 13 }, // hex: 0x0d - LBA "OK" symbol

  // Mapping capital accented A letters, that are not present in LBA2 font to the regular A
  { key: "Á", val: 65 }, // hex: 0x41
  { key: "Â", val: 65 }, // hex: 0x41

  // Mapping capital accented E letters, that are not present in LBA2 font to the regular E
  { key: "Ê", val: 69 }, // hex: 0x45
  { key: "Ë", val: 69 }, // hex: 0x45
  { key: "È", val: 69 }, // hex: 0x45

  // Mapping capital accented I letters, that are not present in LBA2 font to the regular I
  { key: "Í", val: 73 }, // hex: 0x49
  { key: "Î", val: 73 }, // hex: 0x49
  { key: "Ï", val: 73 }, // hex: 0x49
  { key: "Ì", val: 73 }, // hex: 0x49

  // Mapping capital accented O letters, that are not present in LBA2 font to the regular O
  { key: "Ó", val: 79 }, // hex: 0x4f
  { key: "Ô", val: 79 }, // hex: 0x4f
  { key: "Ò", val: 79 }, // hex: 0x4f

  // Mapping capital accented U letters, that are not present in LBA2 font to the regular U
  { key: "Ú", val: 85 }, // hex: 0x55
  { key: "Û", val: 85 }, // hex: 0x55
  { key: "Ù", val: 85 }, // hex: 0x55

  // Here start the upper extended characters
  { key: "Ç", val: 128 }, // hex: 0x80
  { key: "ü", val: 129 }, // hex: 0x81
  { key: "é", val: 130 }, // hex: 0x82
  { key: "â", val: 131 }, // hex: 0x83
  { key: "ä", val: 132 }, // hex: 0x84
  { key: "à", val: 133 }, // hex: 0x85
  { key: "ç", val: 135 }, // hex: 0x87
  { key: "ê", val: 136 }, // hex: 0x88
  { key: "ë", val: 137 }, // hex: 0x89
  { key: "è", val: 138 }, // hex: 0x8a
  { key: "ï", val: 139 }, // hex: 0x8b
  { key: "î", val: 140 }, // hex: 0x8c
  { key: "ì", val: 141 }, // hex: 0x8d
  { key: "Ä", val: 142 }, // hex: 0x8e

  { key: "É", val: 144 }, // hex: 0x90
  { key: "æ", val: 145 }, // hex: 0x91
  { key: "Æ", val: 146 }, // hex: 0x92
  { key: "ô", val: 147 }, // hex: 0x93
  { key: "ö", val: 148 }, // hex: 0x94
  { key: "ò", val: 149 }, // hex: 0x95
  { key: "û", val: 150 }, // hex: 0x96
  { key: "ù", val: 151 }, // hex: 0x97
  { key: "ÿ", val: 152 }, // hex: 0x98
  { key: "Ö", val: 153 }, // hex: 0x99
  { key: "Ü", val: 154 }, // hex: 0x9a
  { key: "£", val: 156 }, // hex: 0x9c

  { key: "á", val: 160 }, // hex: 0xa0
  { key: "í", val: 161 }, // hex: 0xa1
  { key: "ó", val: 162 }, // hex: 0xa2
  { key: "ú", val: 163 }, // hex: 0xa3
  { key: "ñ", val: 164 }, // hex: 0xa4
  { key: "Ñ", val: 165 }, // hex: 0xa5
  { key: "¿", val: 168 }, // hex: 0xa8
  { key: "¡", val: 173 }, // hex: 0xad

  { key: "ã", val: 176 }, // hex: 0xb0
  { key: "õ", val: 177 }, // hex: 0xb1
  { key: "œ", val: 180 }, // hex: 0xb4
  { key: "Œ", val: 181 }, // hex: 0xb5
  { key: "À", val: 182 }, // hex: 0xb6
  { key: "Ã", val: 183 }, // hex: 0xb7
  { key: "Õ", val: 184 }, // hex: 0xb8
  { key: "©", val: 189 }, // hex: 0xbd
  { key: "™", val: 191 }, // hex: 0xbf

  { key: "ß", val: 225 }, // hex: 0xe1
  { key: "º", val: 248 }, // hex: 0xf8
];
