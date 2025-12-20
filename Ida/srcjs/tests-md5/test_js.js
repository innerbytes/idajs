// Load the MD5 library
const md5 = require("./md5.js");

console.log("=== JavaScript MD5 Implementation Test ===\n");

// Test cases with known expected values
const tests = [
  {
    input: "",
    expected: "d41d8cd98f00b204e9800998ecf8427e",
    name: "Empty string",
  },
  {
    input: "a",
    expected: "0cc175b9c0f1b6a831c399e269772661",
    name: "Single 'a'",
  },
  { input: "abc", expected: "900150983cd24fb0d6963f7d28e17f72", name: "abc" },
  {
    input: "message digest",
    expected: "f96b697d7cb7938d525a2f31aaf161d0",
    name: "message digest",
  },
  {
    input: "abcdefghijklmnopqrstuvwxyz",
    expected: "c3fcd3d76192e4007dfb496cca67e13b",
    name: "alphabet",
  },
  {
    input: "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789",
    expected: "d174ab98d277d9f5a5611c2c9f419d9f",
    name: "alphanumeric",
  },
  {
    input: "The quick brown fox jumps over the lazy dog",
    expected: "9e107d9d372bb6826bd81d3542a419d6",
    name: "quick brown fox",
  },
  {
    input:
      "12345678901234567890123456789012345678901234567890123456789012345678901234567890",
    expected: "57edf4a22be3c955ac49da2e2107b67a",
    name: "80 chars of digits",
  },
];

let passed = 0;
const total = tests.length;

for (let i = 0; i < total; i++) {
  const result = md5(tests[i].input);
  const match = result === tests[i].expected;
  if (match) passed++;

  console.log(`Test ${i + 1} (${tests[i].name}):`);
  console.log(`  Input:    "${tests[i].input}"`);
  console.log(`  Result:   ${result}`);
  console.log(`  Expected: ${tests[i].expected}`);
  console.log(`  Status:   ${match ? "PASS" : "FAIL"}\n`);
}

console.log(`Summary: ${passed}/${total} tests passed`);

process.exit(passed === total ? 0 : 1);
