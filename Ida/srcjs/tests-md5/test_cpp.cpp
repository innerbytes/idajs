#include <iostream>
#include <string>

#include "MD5.h"

int main()
{
    std::cout << "=== C++ MD5 Implementation Test ===" << std::endl << std::endl;

    // Test cases with known expected values
    struct TestCase
    {
        std::string input;
        std::string expected;
        std::string name;
    };

    TestCase tests[] = {
        {"", "d41d8cd98f00b204e9800998ecf8427e", "Empty string"},
        {"a", "0cc175b9c0f1b6a831c399e269772661", "Single 'a'"},
        {"abc", "900150983cd24fb0d6963f7d28e17f72", "abc"},
        {"message digest", "f96b697d7cb7938d525a2f31aaf161d0", "message digest"},
        {"abcdefghijklmnopqrstuvwxyz", "c3fcd3d76192e4007dfb496cca67e13b", "alphabet"},
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789", "d174ab98d277d9f5a5611c2c9f419d9f",
         "alphanumeric"},
        {"The quick brown fox jumps over the lazy dog", "9e107d9d372bb6826bd81d3542a419d6", "quick brown fox"},
        {"12345678901234567890123456789012345678901234567890123456789012345678901234567890",
         "57edf4a22be3c955ac49da2e2107b67a", "80 chars of digits"}};

    int passed = 0;
    int total = sizeof(tests) / sizeof(tests[0]);

    for (int i = 0; i < total; i++)
    {
        Ida::MD5 md5;
        md5.update(reinterpret_cast<const uint8_t *>(tests[i].input.c_str()), tests[i].input.length());
        std::string result = md5.finalize();

        bool match = (result == tests[i].expected);
        if (match) passed++;

        std::cout << "Test " << (i + 1) << " (" << tests[i].name << "):" << std::endl;
        std::cout << "  Input:    \"" << tests[i].input << "\"" << std::endl;
        std::cout << "  Result:   " << result << std::endl;
        std::cout << "  Expected: " << tests[i].expected << std::endl;
        std::cout << "  Status:   " << (match ? "PASS" : "FAIL") << std::endl << std::endl;
    }

    std::cout << "Summary: " << passed << "/" << total << " tests passed" << std::endl;

    return (passed == total) ? 0 : 1;
}
