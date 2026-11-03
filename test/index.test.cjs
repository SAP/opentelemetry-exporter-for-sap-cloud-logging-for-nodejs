const assert = require("node:assert/strict")
const { describe, it } = require("node:test")
const publicApi = require("..")

const expectedExports = {
    CloudLoggingCredentials: require("../build/cf/cloudLoggingCredentials").CloudLoggingCredentials,
    CloudLoggingServiceBindingsProvider: require("../build/cf/cloudLoggingServiceBindingsProvider").CloudLoggingServiceBindingsProvider,
    ServiceBinding: require("../build/cf/serviceBinding").ServiceBinding,
    ServiceBindingsProvider: require("../build/cf/serviceBindingsProvider").ServiceBindingsProvider,
    Application: require("../build/cf/application").Application,
    ApplicationProvider: require("../build/cf/applicationProvider").ApplicationProvider,
    CFApplicationDetector: require("../build/detectors/cfApplicationDetector").CFApplicationDetector,
    AutoCloudLoggingLogsExporter: require("../build/exporters/autoconfig/autoCloudLoggingLogExporter").AutoCloudLoggingLogsExporter,
    AutoCloudLoggingMetricsExporter: require("../build/exporters/autoconfig/autoCloudLoggingMetricExporter").AutoCloudLoggingMetricsExporter,
    AutoCloudLoggingSpanExporter: require("../build/exporters/autoconfig/autoCloudLoggingSpanExporter").AutoCloudLoggingSpanExporter,
}

describe("Package entry point", () => {
    for (const [name, implementation] of Object.entries(expectedExports)) {
        it(`exports ${name} from the package root`, () => {
            assert.equal(publicApi[name], implementation)
        })
    }
})
