const assert = require("node:assert/strict")
const { describe, it } = require("node:test")
const { CloudLoggingCredentials } = require("../build/cf/cloudLoggingCredentials")

const validCredentials = {
    "ingest-otlp-endpoint": "localhost:4317",
    "ingest-otlp-cert": "client-cert",
    "ingest-otlp-key": "client-key",
    "server-ca": "server-ca",
}

describe("CloudLoggingCredentials", () => {
    it("parses the endpoint and certificate buffers", () => {
        const credentials = CloudLoggingCredentials.parse(validCredentials)

        assert.equal(credentials.validate(), true)
        assert.equal(credentials.getEndpoint(), "https://localhost:4317")
        assert.deepEqual(credentials.getClientCert(), Buffer.from("client-cert"))
        assert.deepEqual(credentials.getClientKey(), Buffer.from("client-key"))
        assert.deepEqual(credentials.getServerCert(), Buffer.from("server-ca"))
    })

    for (const serverCa of [undefined, ""]) {
        it(`accepts ${serverCa === undefined ? "missing" : "empty"} server-ca`, () => {
            const credentials = CloudLoggingCredentials.parse({
                ...validCredentials,
                "server-ca": serverCa,
            })

            assert.equal(credentials.validate(), true)
            assert.equal(credentials.getServerCert(), undefined)
        })
    }

    for (const field of ["ingest-otlp-endpoint", "ingest-otlp-cert", "ingest-otlp-key"]) {
        for (const [scenario, value] of [["empty", ""], ["missing", undefined], ["null", null]]) {
            it(`rejects ${scenario} ${field}`, () => {
                const credentials = CloudLoggingCredentials.parse({ ...validCredentials, [field]: value })

                assert.equal(credentials.validate(), false)
            })
        }
    }

    for (const [scenario, value] of [["empty", {}], ["missing", undefined], ["null", null]]) {
        it(`rejects ${scenario} credentials`, () => {
            const credentials = CloudLoggingCredentials.parse(value)

            assert.equal(credentials.validate(), false)
        })
    }
})
