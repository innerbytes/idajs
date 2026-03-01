#include "decorsTrace.h"
#include "../c_extern.h"

extern S16 ListVarGame[];
extern S32 NbObjDecors;

static S32 IsDecorTraceEnabled()
{
	static S32 isInitialized = FALSE;
	static S32 isEnabled = FALSE;

	if (!isInitialized)
	{
		const char *env = getenv("LBA_TRACE_DECORS");
		if (env AND * env AND strcmp(env, "0"))
			isEnabled = TRUE;

		isInitialized = TRUE;

		if (isEnabled)
			printf("[DECORS] Trace enabled (set LBA_TRACE_DECORS=0 to disable).\n");
	}

	return isEnabled;
}

static S16 GetDecorVarValue(S32 numvar)
{
	if (numvar < 0)
		return ListVarGame[-numvar];
	return ListVarGame[numvar];
}

static S32 TraceEnabled = FALSE;
static S32 NbConditional = 0;
static S32 NbConditionalHidden = 0;
static S32 NbAlwaysVisible = 0;

namespace IdaHelpers
{
namespace Decors
{

void Trace_BeginVisibilityPass(void)
{
	TraceEnabled = IsDecorTraceEnabled();
	NbConditional = 0;
	NbConditionalHidden = 0;
	NbAlwaysVisible = 0;

	if (TraceEnabled)
	{
		printf("[DECORS] Begin visibility pass: island=%d cube=%d total=%d\n",
			   Island, NumCube, NbObjDecors);
	}
}

void Trace_LogConditionalDecor(S32 decorIndex, S32 bodyId, S32 numvar, S32 isInvisible)
{
	S16 varValue = GetDecorVarValue(numvar);
	
	NbConditional++;
	if (isInvisible)
		NbConditionalHidden++;

	if (TraceEnabled)
	{
		printf("[DECORS] decor=%3d body=%3d numvar=%4d var[%3d]=%6d rule=%s -> %s\n",
			   decorIndex,
			   bodyId,
			   numvar,
			   abs(numvar),
			   varValue,
			   (numvar < 0) ? "hide_if_zero" : "hide_if_nonzero",
			   isInvisible ? "HIDDEN" : "VISIBLE");
	}
}

void Trace_LogUnconditionalDecor(void)
{
	NbAlwaysVisible++;
}

void Trace_EndVisibilityPass(void)
{
	if (TraceEnabled)
	{
		printf("[DECORS] End visibility pass: conditional=%d hidden=%d visible=%d unconditional_visible=%d\n",
			   NbConditional,
			   NbConditionalHidden,
			   NbConditional - NbConditionalHidden,
			   NbAlwaysVisible);
	}
}

}
}
