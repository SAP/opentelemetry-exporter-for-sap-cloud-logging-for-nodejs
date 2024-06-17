import { DiagLogger, diag } from "@opentelemetry/api"
import { ServiceBinding } from "./serviceBinding"

export class ServiceBindingsProvider {

    private static ENV_VCAP_SERVICES = "VCAP_SERVICES"

    private diagLogger: DiagLogger
    private bindings: ServiceBinding[]

    public constructor() {
        this.diagLogger = diag.createComponentLogger({
            namespace: "ServiceBindingsProvider"
        })
        this.bindings = []

        let rawData = process.env[ServiceBindingsProvider.ENV_VCAP_SERVICES]
        if (rawData) {
            try {
                let services = JSON.parse(rawData)
                for (let serviceName in services) {
                    services[serviceName].forEach((rawBinding: any) => {
                        this.bindings.push(new ServiceBinding(serviceName, rawBinding))
                    })
                }     
            } catch (e: unknown) {
                (e as Error).message
                this.diagLogger.error(`Failed to parse JSON data from ${ServiceBindingsProvider.ENV_VCAP_SERVICES}. ${(e as Error).message}`)
            }        
        }
    }

    public get(): ServiceBinding[] {
        return this.bindings
    }
}
