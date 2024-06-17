import { ExportResult, ExportResultCode } from "@opentelemetry/core"
import { LogRecordExporter, ReadableLogRecord } from "@opentelemetry/sdk-logs"
import { diag, DiagLogger } from '@opentelemetry/api'

export abstract class MultiLogRecordExporter implements LogRecordExporter {

    protected diagLogger: DiagLogger
    protected logRecordExporters: LogRecordExporter[]

    protected constructor(className: string = "MultiLogRecordExporter") {
        this.logRecordExporters = []
        this.diagLogger = diag.createComponentLogger({
            namespace: className
        })
    }

    public add(...exporters: LogRecordExporter[]) {
        this.logRecordExporters.push(...exporters)
    }

    public export(logs: ReadableLogRecord[], resultCallback: (result: ExportResult) => void): void {
        let promises = this.logRecordExporters.map((exporter) => new Promise<ExportResult>((resolve) => exporter.export(logs, (result) => {
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
        let promises = this.logRecordExporters.map((exporter) => exporter.shutdown())
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
