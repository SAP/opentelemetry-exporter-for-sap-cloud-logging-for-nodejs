import { NodeSDK } from '@opentelemetry/sdk-node'
import { PeriodicExportingMetricReader } from "@opentelemetry/sdk-metrics"
import { BatchLogRecordProcessor, ConsoleLogRecordExporter } from '@opentelemetry/sdk-logs'
import { AutoCloudLoggingLogsExporter, AutoCloudLoggingMetricsExporter, AutoCloudLoggingSpanExporter, CFApplicationDetector } from "@sap/opentelemetry-exporter-for-sap-cloud-logging"
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http"
import { ExpressInstrumentation } from "@opentelemetry/instrumentation-express"
import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api'

diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO)

const sdk = new NodeSDK({
  traceExporter: new AutoCloudLoggingSpanExporter(),
  metricReaders: [
    new PeriodicExportingMetricReader({
      exporter: new AutoCloudLoggingMetricsExporter()
    })
  ],
  logRecordProcessors: [
    new BatchLogRecordProcessor(new AutoCloudLoggingLogsExporter())
  ],
  instrumentations: [
    new HttpInstrumentation(),
    new ExpressInstrumentation()
  ],
  resourceDetectors: [
    new CFApplicationDetector()
  ]
})

sdk.start()
