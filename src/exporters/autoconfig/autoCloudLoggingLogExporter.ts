import { CloudLoggingServiceBindingsProvider } from "../../cf/cloudLoggingServiceBindingsProvider"
import { MultiLogRecordExporter } from "../multi/multiLogExporter"
import { CloudLoggingCredentials } from "../../cf/cloudLoggingCredentials"
import { ServiceBinding } from "../../cf/serviceBinding"
import { createSecureContext } from 'tls'
import { credentials as grpcCredentials } from '@grpc/grpc-js'
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-grpc"
import { LogRecordExporter } from "@opentelemetry/sdk-logs"

export class AutoCloudLoggingLogsExporter extends MultiLogRecordExporter {
    public constructor(autoConfigExporters: Boolean = true) {
        super("AutoCloudLoggingLogsExporter")
        if (autoConfigExporters) {
            this.setupExporters();
        }
    }

    private setupExporters() {
        let bindingsProvider = new CloudLoggingServiceBindingsProvider()
        let bindings = bindingsProvider.get()
        let exporters = bindings.map(binding => { return this.createExporterForBinding(binding) })
            .filter(exporter => exporter !== undefined) as LogRecordExporter[]
        this.diagLogger.info(`Setup AutoCloudLoggingLogsExporter with ${exporters.length} exporter(s)`);
        this.add(...exporters)
    }

    private createExporterForBinding(binding: ServiceBinding): LogRecordExporter | undefined {
        let credentials = CloudLoggingCredentials.parse(binding.getCredentials())
        if (!credentials.validate()) {
            return undefined
        }

        let secureContext = createSecureContext({
            cert: credentials.getClientCert(),
            key: credentials.getClientKey()
        })

        this.diagLogger.info(`Creating OTLP log exporter for service binding '${binding.getName()}' (${binding.getLabel()})`);
        return new OTLPLogExporter({
            url: credentials.getEndpoint(),
            credentials: grpcCredentials.createFromSecureContext(secureContext),
        })
    }
}
