const assert = require("node:assert/strict")
const { describe, it } = require("node:test")
const { ServiceBinding } = require("../build/cf/serviceBinding")
const { ServiceBindingsProvider } = require("../build/cf/serviceBindingsProvider")

function createProvider(context, rawServices) {
    const previousServices = process.env.VCAP_SERVICES
    context.after(() => {
        if (previousServices === undefined) {
            delete process.env.VCAP_SERVICES
        } else {
            process.env.VCAP_SERVICES = previousServices
        }
    })
    if (rawServices === undefined) {
        delete process.env.VCAP_SERVICES
    } else {
        process.env.VCAP_SERVICES = rawServices
    }
    return new ServiceBindingsProvider()
}

describe("ServiceBindingsProvider", () => {
    it("parses every binding across service groups and preserves its fields", context => {
        const services = {
            "cloud-logging": [
                { name: "first", label: "cloud-logging", tags: ["Cloud Logging"], credentials: { endpoint: "first.example" } },
                { name: "second", label: "cloud-logging", tags: ["other-tag"], credentials: { endpoint: "second.example" } },
            ],
            "user-provided": [
                { name: "third", label: "user-provided", tags: [], credentials: { endpoint: "third.example" } },
            ],
        }
        const provider = createProvider(context, JSON.stringify(services))
        const bindings = provider.get()
        const expected = [
            ["cloud-logging", services["cloud-logging"][0]],
            ["cloud-logging", services["cloud-logging"][1]],
            ["user-provided", services["user-provided"][0]],
        ]

        assert.equal(bindings.length, expected.length)
        for (const [index, [serviceName, data]] of expected.entries()) {
            const binding = bindings[index]
            assert.ok(binding instanceof ServiceBinding)
            assert.equal(binding.getServiceName(), serviceName)
            assert.equal(binding.getName(), data.name)
            assert.equal(binding.getLabel(), data.label)
            assert.deepEqual(binding.getTags(), data.tags)
            assert.deepEqual(binding.getCredentials(), data.credentials)
        }
    })

    for (const [scenario, data] of [
        ["missing", {}],
        ["null", { name: null, label: null, tags: null, credentials: null }],
    ]) {
        it(`uses defaults for ${scenario} binding fields`, context => {
            const provider = createProvider(context, JSON.stringify({ "test-service": [data] }))
            const bindings = provider.get()

            assert.equal(bindings.length, 1)
            assert.equal(bindings[0].getServiceName(), "test-service")
            assert.equal(bindings[0].getName(), "")
            assert.equal(bindings[0].getLabel(), "")
            assert.deepEqual(bindings[0].getTags(), [])
            assert.deepEqual(bindings[0].getCredentials(), {})
        })
    }

    for (const [scenario, rawServices] of [
        ["missing", undefined],
        ["empty", ""],
        ["malformed JSON", "{invalid-json"],
        ["null", "null"],
        ["no service groups", "{}"],
        ["empty service group", '{"cloud-logging":[]}'],
        ["non-array service group", '{"cloud-logging":{}}'],
        ["null service group", '{"cloud-logging":null}'],
        ["null binding", '{"cloud-logging":[null]}'],
    ]) {
        it(`returns no bindings for ${scenario} VCAP_SERVICES without throwing`, context => {
            const provider = createProvider(context, rawServices)

            assert.deepEqual(provider.get(), [])
        })
    }
})
