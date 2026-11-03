const assert = require("node:assert/strict")
const { describe, it } = require("node:test")
const { CFApplicationDetector } = require("../build/detectors/cfApplicationDetector")

const validApplication = {
    application_name: "test-app",
    application_id: "app-id",
    instance_index: 2,
    space_id: "space-id",
    space_name: "test-space",
    organization_id: "org-id",
    organization_name: "test-org",
    process_id: "process-id",
    process_type: "web",
}

const expectedAttributes = {
    "service.name": "test-app",
    "sap.cf.source_id": "app-id",
    "sap.cf.instance_id": 2,
    "sap.cf.app_id": "app-id",
    "sap.cf.app_name": "test-app",
    "sap.cf.space_id": "space-id",
    "sap.cf.space_name": "test-space",
    "sap.cf.org_id": "org-id",
    "sap.cf.org_name": "test-org",
    "sap.cf.process.id": "process-id",
    "sap.cf.process.type": "web",
}

const defaultAttributes = {
    "service.name": "",
    "sap.cf.source_id": "",
    "sap.cf.instance_id": -1,
    "sap.cf.app_id": "",
    "sap.cf.app_name": "",
    "sap.cf.space_id": "",
    "sap.cf.space_name": "",
    "sap.cf.org_id": "",
    "sap.cf.org_name": "",
    "sap.cf.process.id": "",
    "sap.cf.process.type": "",
}

function createDetector(context, rawApplication) {
    const previousApplication = process.env.VCAP_APPLICATION
    context.after(() => {
        if (previousApplication === undefined) {
            delete process.env.VCAP_APPLICATION
        } else {
            process.env.VCAP_APPLICATION = previousApplication
        }
    })
    if (rawApplication === undefined) {
        delete process.env.VCAP_APPLICATION
    } else {
        process.env.VCAP_APPLICATION = rawApplication
    }
    return new CFApplicationDetector()
}

describe("CFApplicationDetector", () => {
    it("maps all application fields to resource attributes", context => {
        const detector = createDetector(context, JSON.stringify(validApplication))

        assert.deepEqual(detector.detect(), { attributes: expectedAttributes })
    })

    for (const [scenario, rawApplication] of [
        ["missing", undefined],
        ["empty", ""],
        ["malformed", "{invalid-json"],
        ["null", "null"],
    ]) {
        it(`returns no attributes for ${scenario} VCAP_APPLICATION`, context => {
            const detector = createDetector(context, rawApplication)

            assert.deepEqual(detector.detect(), { attributes: {} })
        })
    }

    it("uses defaults when application fields are missing", context => {
        const detector = createDetector(context, "{}")

        assert.deepEqual(detector.detect(), { attributes: defaultAttributes })
    })

    it("preserves available attributes in a partial application", context => {
        const detector = createDetector(context, JSON.stringify({ application_name: "partial-app" }))

        assert.deepEqual(detector.detect(), {
            attributes: { ...defaultAttributes, "service.name": "partial-app", "sap.cf.app_name": "partial-app" },
        })
    })

    for (const instanceIndex of [0, "0", 3, "3"]) {
        it(`parses ${JSON.stringify(instanceIndex)} as a numeric instance index`, context => {
            const detector = createDetector(context, JSON.stringify({ ...validApplication, instance_index: instanceIndex }))

            assert.deepEqual(detector.detect(), {
                attributes: { ...expectedAttributes, "sap.cf.instance_id": Number(instanceIndex) },
            })
        })
    }

    for (const instanceIndex of [undefined, null, "", "not-a-number"]) {
        it(`defaults ${JSON.stringify(instanceIndex)} instance index to -1`, context => {
            const detector = createDetector(context, JSON.stringify({ ...validApplication, instance_index: instanceIndex }))

            assert.deepEqual(detector.detect(), {
                attributes: { ...expectedAttributes, "sap.cf.instance_id": -1 },
            })
        })
    }
})
