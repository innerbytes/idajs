#pragma once

#include "../IdaBridge.h"
#include "../IdaLbaBridge.h"
#include "../core/ClientObjects.h"
#include "templates.h"

namespace Ida
{
    class LbaClientObjects : public core::ClientObjects
    {
    private:
        IdaLbaBridge *mLbaBridge;
        IdaBridge *mIdaBridge;

    public:
        LbaClientObjects(IdaLbaBridge *lbaBridge, IdaBridge *idaBridge) : mLbaBridge(lbaBridge), mIdaBridge(idaBridge)
        {
        }

        void init(v8::Isolate *isolate, v8::Local<v8::Object> globalObject) const override
        {
            initTemplates(isolate, mLbaBridge, mIdaBridge);
            getIdaTemplate()->bind(globalObject);
            getMarkTemplate()->bind(globalObject);
            getSceneTemplate()->bind(globalObject);
        }

        ~LbaClientObjects() override
        {
            deleteTemplates();
        }
    };
}  // namespace Ida
