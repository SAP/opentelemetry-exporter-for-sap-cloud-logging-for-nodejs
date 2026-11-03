const assert = require("node:assert/strict")
const { describe, it } = require("node:test")
const tls = require("node:tls")

const validCredentials = {
    "ingest-otlp-endpoint": "localhost:4317",
    "ingest-otlp-cert": "client-cert",
    "ingest-otlp-key": "client-key",
    "server-ca": "server-ca",
}

const validBinding = {
    name: "test-binding",
    label: "cloud-logging",
    tags: ["Cloud Logging"],
    credentials: validCredentials,
}

const originalCreateSecureContext = tls.createSecureContext

function createExporter(context, Exporter, bindings = [validBinding], autoConfigure = true) {
    const previousServices = process.env.VCAP_SERVICES
    context.after(() => {
        if (previousServices === undefined) {
            delete process.env.VCAP_SERVICES
        } else {
            process.env.VCAP_SERVICES = previousServices
        }
    })
    process.env.VCAP_SERVICES = JSON.stringify({ "cloud-logging": bindings })

    const createContext = context.mock.method(tls, "createSecureContext", () => originalCreateSecureContext())
    const exporter = new Exporter(autoConfigure)
    context.after(() => exporter.shutdown())
    return createContext.mock
}

const exporters = [
    ["logs", require("../build/exporters/autoconfig/autoCloudLoggingLogExporter").AutoCloudLoggingLogsExporter],
    ["metrics", require("../build/exporters/autoconfig/autoCloudLoggingMetricExporter").AutoCloudLoggingMetricsExporter],
    ["spans", require("../build/exporters/autoconfig/autoCloudLoggingSpanExporter").AutoCloudLoggingSpanExporter],
]

for (const [signal, Exporter] of exporters) {
    describe(`${signal} auto-configuration`, () => {
        for (const [scenario, serverCa] of [
            ["pins the supplied server-ca without adding default roots", "server-ca"],
            ["uses default trust when server-ca is missing", undefined],
            ["uses default trust when server-ca is empty", ""],
        ]) {
            it(scenario, context => {
                const credentials = { ...validCredentials, "server-ca": serverCa }
                const createContext = createExporter(context, Exporter, [{ ...validBinding, credentials }])

                assert.equal(createContext.callCount(), 1)
                const [options] = createContext.calls[0].arguments
                assert.deepEqual(options.cert, Buffer.from("client-cert"))
                assert.deepEqual(options.key, Buffer.from("client-key"))
                if (serverCa) {
                    assert.deepEqual(options.ca, Buffer.from(serverCa))
                } else {
                    assert.equal(Object.hasOwn(options, "ca"), false)
                }
            })
        }

        it("does not configure TLS without bindings", context => {
            const createContext = createExporter(context, Exporter, [])

            assert.equal(createContext.callCount(), 0)
        })

        it("allows auto-configuration to be disabled", context => {
            const createContext = createExporter(context, Exporter, [validBinding], false)

            assert.equal(createContext.callCount(), 0)
        })

        it("skips bindings with invalid credentials", context => {
            const credentials = { ...validCredentials, "ingest-otlp-endpoint": "" }
            const createContext = createExporter(context, Exporter, [{ ...validBinding, credentials }])

            assert.equal(createContext.callCount(), 0)
        })

        it("skips bindings with no credentials", context => {
            const createContext = createExporter(context, Exporter, [
                { ...validBinding, credentials: undefined },
                { ...validBinding, credentials: null },
                { ...validBinding, credentials: {} },
            ])

            assert.equal(createContext.callCount(), 0)
        })

        for (const field of ["ingest-otlp-endpoint", "ingest-otlp-cert", "ingest-otlp-key"]) {
            it(`keeps valid bindings when another is missing ${field}`, context => {
                const credentials = { ...validCredentials }
                delete credentials[field]
                const createContext = createExporter(context, Exporter, [
                    { ...validBinding, credentials },
                    validBinding,
                ])

                assert.equal(createContext.callCount(), 1)
                const [options] = createContext.calls[0].arguments
                assert.deepEqual(options.cert, Buffer.from("client-cert"))
                assert.deepEqual(options.key, Buffer.from("client-key"))
            })
        }

        it("ignores bindings with unrelated labels or missing Cloud Logging tags", context => {
            const createContext = createExporter(context, Exporter, [
                { ...validBinding, label: "other-service" },
                { ...validBinding, tags: [] },
            ])

            assert.equal(createContext.callCount(), 0)
        })

        it("configures both managed and user-provided Cloud Logging bindings", context => {
            const createContext = createExporter(context, Exporter, [
                validBinding,
                { ...validBinding, name: "user-provided-binding", label: "user-provided" },
            ])

            assert.equal(createContext.callCount(), 2)
            for (const call of createContext.calls) {
                assert.deepEqual(call.arguments[0].ca, Buffer.from("server-ca"))
            }
        })
    })
}
