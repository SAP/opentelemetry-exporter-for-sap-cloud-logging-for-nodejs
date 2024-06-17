import { ExportResult, ExportResultCode } from "@opentelemetry/core"
import { PushMetricExporter, ResourceMetrics } from "@opentelemetry/sdk-metrics"
import { diag, DiagLogger } from '@opentelemetry/api'

export abstract class MultiMetricExporter implements PushMetricExporter {

    protected diagLogger: DiagLogger
    protected metricExporters: PushMetricExporter[];

    protected constructor(className: string = "MultiMetricExporter") {
        this.metricExporters = []
        this.diagLogger = diag.createComponentLogger({
            namespace: className
        })
    }

    public add(...exporters: PushMetricExporter[]) {
        this.metricExporters.push(...exporters)
    }

    public forceFlush(): Promise<void> {
        let promises = this.metricExporters.map((exporter) => exporter.forceFlush())
        let overallPromise = new Promise<void>((resolve, reject) => {
            Promise.all(promises).then(() => {
                resolve()
            }).catch((reason) => {
                reject(reason)
            })
        })
        return overallPromise
    }

    public export(metrics: ResourceMetrics, resultCallback: (result: ExportResult) => void): void {
        let promises = this.metricExporters.map((exporter) => new Promise<ExportResult>((resolve) => exporter.export(metrics, (result) => {
            if (result.code == ExportResultCode.FAILED && result.error) {
                this.diagLogger.warn("Error returned by the export.", result.error)
            }
            resolve(result)
        })))
        Promise.all(promises).then(
            (results) => resultCallback({ code: results.every(result => result.code == ExportResultCode.SUCCESS) ? ExportResultCode.SUCCESS : ExportResultCode.FAILED })
        )
    }

    public shutdown(): Promise<void> {
        let promises = this.metricExporters.map((exporter) => exporter.shutdown())
        let overallPromise = new Promise<void>((resolve, reject) => {
            Promise.all(promises).then(() => {
                resolve()
            }).catch((reason) => {
                reject(reason)
            })
        })
        return overallPromise
    }
}
