#ifndef IDA_DECORS_TRACE_H
#define IDA_DECORS_TRACE_H

namespace IdaHelpers
{
    namespace Decors
    {
        void trace_BeginVisibilityPass(void);
        void trace_LogConditionalDecor(S32 decorIndex, S32 bodyId, S32 numvar, S32 isInvisible);
        void trace_LogUnconditionalDecor(void);
        void trace_EndVisibilityPass(void);
    }
}

#endif
