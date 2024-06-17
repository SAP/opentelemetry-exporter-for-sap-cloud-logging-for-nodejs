import { DiagLogger, diag } from "@opentelemetry/api"
import { Application } from "./application"

export class ApplicationProvider {

    private static ENV_VCAP_APPLICATION = "VCAP_APPLICATION"

    private diagLogger: DiagLogger

    private app: Application | undefined

    public constructor() {
        this.diagLogger = diag.createComponentLogger({
            namespace: "ApplicationProvider"
        })

        let rawData = process.env[ApplicationProvider.ENV_VCAP_APPLICATION]
        if (rawData) {
            try {
                let data = JSON.parse(rawData)
                this.app = Application.parse(data)
            } catch (e: unknown) {
                (e as Error).message
                this.diagLogger.error(`Failed to parse JSON data from ${ApplicationProvider.ENV_VCAP_APPLICATION}. ${(e as Error).message}`)
            }        
        }
    }

    public get(): Application | undefined {
        return this.app
    }
}
