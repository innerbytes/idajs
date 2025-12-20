#include <iostream>
#include <string>

#include "MD5.h"

int main(int argc, char* argv[])
{
    std::string input = "";

    // If argument provided, use it; otherwise use empty string
    if (argc > 1)
    {
        input = argv[1];
    }

    Ida::MD5 md5;
    md5.update(reinterpret_cast<const uint8_t*>(input.c_str()), input.length());
    std::string result = md5.finalize();

    // Output only the hash (no extra text)
    std::cout << result << std::endl;

    return 0;
}
