import express from 'express'
import log, { FieldInclusionMode, OpenTelemetryLogsOutputPlugin }  from 'cf-nodejs-logging-support'

const HTTP_PORT = Number(process.env.VCAP_APP_PORT || 3000)
var app = express()

// Create an instance of the OpenTelemetryLogsOutputPlugin. 
// By default, it will use the global logger provider
var otelOutputPlugin = new OpenTelemetryLogsOutputPlugin()

// Optionally set whether additional log fields should be included as log attributes. Default: include custom fields only.
otelOutputPlugin.setIncludeFieldsAsAttributes(FieldInclusionMode.CustomFieldsOnly)

// Set OutputPlugin for cf-nodejs-logging-support
log.addOutputPlugin(otelOutputPlugin)

// Set the minimum logging level (Levels: off, error, warn, info, verbose, debug, silly)
log.setLoggingLevel("info")

// Bind to express app
app.use(log.logNetwork)

app.get('/', function (req: any, res: any) {
    // Context bound message with a custom field
    req.logger.info("Hello World will be sent", { foo: "bar" })

    res.send('Hello World')
})

app.get('/error', function (req: any, res: any) {
    try {
        throw new Error("some error message")
    } catch (e) {
        req.logger.error("Error", e)
    }
    res.send('Failed as intended')
})

// Listen on specified port
app.listen(HTTP_PORT)

// Formatted log message
log.info("Server is listening on port %d", HTTP_PORT)
