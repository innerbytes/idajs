#include "idajs.h"

#include "../common/Logger.h"

using namespace Logger;

namespace Ida
{
    DialogColors inscope_readDialogColor(v8::Local<v8::Value> colorValue)
    {
        if (!colorValue->IsUint32())
        {
            return DialogColors::None;
        }
        auto color = colorValue.As<v8::Uint32>();
        if (color->Value() > 15)
        {
            err() << "Dialog color must be in range 0..15";
            return DialogColors::None;
        }

        return static_cast<DialogColors>(color->Value());
    }

    int inscope_read256Color(v8::Local<v8::Value> colorValue)
    {
        if (!colorValue->IsUint32())
        {
            return -1;
        }
        auto color = colorValue.As<v8::Uint32>();
        if (color->Value() > 255)
        {
            err() << "Dialog color must be in range 0..255";
            return -1;
        }

        return color->Value();
    }
}  // namespace Ida
