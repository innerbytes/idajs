#include "../c_extern.h"

extern S16 ListVarGame[];
extern S32 NbObjDecors;

static S16 getDecorVarValue(S32 numvar)
{
	if (numvar < 0)
		return ListVarGame[-numvar];
	return ListVarGame[numvar];
}

static S32 nbConditional = 0;
static S32 nbConditionalHidden = 0;
static S32 nbAlwaysVisible = 0;

namespace IdaHelpers
{
	namespace Decors
	{
		void trace_BeginVisibilityPass(void)
		{
			nbConditional = 0;
			nbConditionalHidden = 0;
			nbAlwaysVisible = 0;

			if (idaTraceDecors)
			{
				printf("[DECORS] Begin visibility pass: island=%d cube=%d total=%d\n",
					   Island, NumCube, NbObjDecors);
			}
		}

		void trace_LogConditionalDecor(S32 decorIndex, S32 bodyId, S32 numvar, S32 isInvisible)
		{
			S16 varValue = getDecorVarValue(numvar);

			nbConditional++;
			if (isInvisible)
				nbConditionalHidden++;

			if (idaTraceDecors)
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

		void trace_LogUnconditionalDecor(void)
		{
			nbAlwaysVisible++;
		}

		void trace_EndVisibilityPass(void)
		{
			if (idaTraceDecors)
			{
				printf("[DECORS] End visibility pass: conditional=%d hidden=%d visible=%d unconditional_visible=%d\n",
					   nbConditional,
					   nbConditionalHidden,
					   nbConditional - nbConditionalHidden,
					   nbAlwaysVisible);
			}
		}

	}
}
