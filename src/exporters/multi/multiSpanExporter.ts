import { ExportResult, ExportResultCode } from "@opentelemetry/core"
import { SpanExporter, ReadableSpan } from "@opentelemetry/sdk-trace-base"
import { diag, DiagLogger } from '@opentelemetry/api'

export class MultiSpanExporter implements SpanExporter {

    protected spanExporters: SpanExporter[]
    protected diagLogger: DiagLogger

    public constructor(className: string = "MultiSpanExporter") {
        this.spanExporters = []
        this.diagLogger = diag.createComponentLogger({
            namespace: className
        })
    }

    add(...exporters: SpanExporter[]) {
        this.spanExporters.push(...exporters)
    }

    export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
        let promises = this.spanExporters.map((exporter) => new Promise<ExportResult>((resolve) => exporter.export(spans, (result) => {
            if (result.code == ExportResultCode.FAILED && result.error) {
                this.diagLogger.warn("Error returned by the export.", result.error)
            }
            resolve(result)
        })))
        Promise.all(promises).then(
            (results) => resultCallback({ code: results.every(result => result.code == ExportResultCode.SUCCESS) ? ExportResultCode.SUCCESS : ExportResultCode.FAILED })
        )
    }

    shutdown(): Promise<void> {
        let promises = this.spanExporters.map((exporter) => exporter.shutdown())
        let overallPromise = new Promise<void>((resolve, reject) => {
            Promise.all(promises).then(() => {
                resolve()
            }).catch((reason) => {
                reject(reason)
            })
        })
        return overallPromise
    }

    forceFlush?(): Promise<void> {
        let promises = this.spanExporters.map((exporter) => exporter.forceFlush?.())
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
