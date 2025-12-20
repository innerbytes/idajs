#include "PromiseRejectionHandler.h"

#include <iostream>

#include "../../../common/Logger.h"

using namespace v8;
using namespace Logger;

namespace core
{

    struct RejectedPromise
    {
        v8::Global<v8::Promise> promise;
        v8::Global<v8::Value> reason;
    };

    static std::map<uint64_t, RejectedPromise> mRejectedPromises;
    static std::atomic<uint64_t> mNextId(1);
    static Isolate *mIsolate;

    PromiseRejectionHandler::PromiseRejectionHandler(Isolate *isolate)
    {
        mIsolate = isolate;
        mIsolate->SetPromiseRejectCallback(promiseRejectCallback);
    }

    PromiseRejectionHandler::~PromiseRejectionHandler()
    {
        mIsolate->SetPromiseRejectCallback(nullptr);
        for (auto &[id, entry] : mRejectedPromises)
        {
            entry.promise.Reset();
            entry.reason.Reset();
        }
        mRejectedPromises.clear();
        mNextId = 1;
        mIsolate = nullptr;
    }

    void PromiseRejectionHandler::promiseRejectCallback(PromiseRejectMessage message)
    {
        HandleScope handle_scope(mIsolate);

        PromiseRejectEvent event = message.GetEvent();
        Local<Promise> promise = message.GetPromise();
        Local<Value> reason = message.GetValue();

        Local<Private> promiseIdKey = Private::ForApi(mIsolate, String::NewFromUtf8Literal(mIsolate, "promiseId"));

        if (event == PromiseRejectEvent::kPromiseRejectWithNoHandler)
        {
            uint64_t id = mNextId.fetch_add(1, std::memory_order_relaxed);
            promise->SetPrivate(mIsolate->GetCurrentContext(), promiseIdKey, BigInt::NewFromUnsigned(mIsolate, id))
                .Check();

            mRejectedPromises[id] = {Global<Promise>(mIsolate, promise), Global<Value>(mIsolate, reason)};
        }
        else if (event == PromiseRejectEvent::kPromiseHandlerAddedAfterReject)
        {
            if (!promise->HasPrivate(mIsolate->GetCurrentContext(), promiseIdKey).FromMaybe(false))
            {
                err() << "PromiseRejectionHandler: "
                         "PromiseRejectEvent::kPromiseHandlerAddedAfterReject: Promise has no id";
                return;
            }

            Local<BigInt> idValue =
                promise->GetPrivate(mIsolate->GetCurrentContext(), promiseIdKey).ToLocalChecked().As<BigInt>();

            auto it = mRejectedPromises.find(idValue->Uint64Value());
            if (it != mRejectedPromises.end())
            {
                RejectedPromise &rejectedPromise = it->second;
                rejectedPromise.promise.Reset();
                rejectedPromise.reason.Reset();
                mRejectedPromises.erase(it);
            }
        }
    }

    void PromiseRejectionHandler::checkUnhandledRejections()
    {
        HandleScope handleScope(mIsolate);

        Local<Context> context = mIsolate->GetCurrentContext();

        for (auto &[id, entry] : mRejectedPromises)
        {
            Local<Promise> promise = entry.promise.Get(mIsolate);
            Local<Value> reason = entry.reason.Get(mIsolate);

            if (promise->State() == Promise::kRejected)
            {
                inscope_outputUnhandledRejection(reason);
            }

            entry.promise.Reset();
            entry.reason.Reset();
        }

        mRejectedPromises.clear();
    }

    void PromiseRejectionHandler::inscope_outputUnhandledRejection(Local<Value> reason)
    {
        v8::String::Utf8Value exceptionStr(mIsolate, reason);
        std::string errorMessage = *exceptionStr ? *exceptionStr : "Unknown error";

        v8::Local<v8::Message> msg = v8::Exception::CreateMessage(mIsolate, reason);
        v8::String::Utf8Value scriptName(mIsolate, msg->GetScriptOrigin().ResourceName());
        int line = msg->GetLineNumber(mIsolate->GetCurrentContext()).FromMaybe(-1);
        int column = msg->GetStartColumn(mIsolate->GetCurrentContext()).FromMaybe(-1);

        err() << "Unhandled Promise rejection in " << (*scriptName ? *scriptName : "unknown script") << " at line "
              << line << ", column " << column << ": " << errorMessage;
    }
}  // namespace core
