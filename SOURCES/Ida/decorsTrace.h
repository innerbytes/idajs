#ifndef IDA_DECORS_TRACE_H
#define IDA_DECORS_TRACE_H

#include "../defines.h"

namespace IdaHelpers
{
    namespace Decors
    {
        void Trace_BeginVisibilityPass(void);
        void Trace_LogConditionalDecor(S32 decorIndex, S32 bodyId, S32 numvar, S32 isInvisible);
        void Trace_LogUnconditionalDecor(void);
        void Trace_EndVisibilityPass(void);
    }
}

#endif
