import { CloudLoggingServiceBindingsProvider } from "../../cf/cloudLoggingServiceBindingsProvider"
import { ServiceBinding } from "../../cf/serviceBinding"
import { CloudLoggingCredentials } from "../../cf/cloudLoggingCredentials"
import { createSecureContext } from 'tls'
import { MultiSpanExporter } from "../multi/multiSpanExporter"
import { credentials as grpcCredentials } from '@grpc/grpc-js'
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-grpc"
import { SpanExporter } from "@opentelemetry/sdk-trace-base"

export class AutoCloudLoggingSpanExporter extends MultiSpanExporter {
    public constructor(autoConfigExporters: Boolean = true) {
        super("AutoCloudLoggingSpanExporter")
        if (autoConfigExporters) {
            this.setupExporters()
        }
    }

    private setupExporters() {
        let bindingsProvider = new CloudLoggingServiceBindingsProvider()
        let bindings = bindingsProvider.get()
        let exporters = bindings.map(binding => { return this.createExporterForService(binding) })
            .filter(exporter => exporter !== undefined) as SpanExporter[]
            this.diagLogger.info(`Setup AutoCloudLoggingSpanExporter with ${exporters.length} exporter(s)`)
        this.add(...exporters)
    }

    private createExporterForService(binding: ServiceBinding): SpanExporter | undefined {
        let credentials = CloudLoggingCredentials.parse(binding.getCredentials())
        if (!credentials.validate()) {
            return undefined
        }

        let secureContext = createSecureContext({
            cert: credentials.getClientCert(),
            key: credentials.getClientKey()
        })

        this.diagLogger.info(`Creating OTLP span exporter for service binding '${binding.getName()}' (${binding.getLabel()})`)
        return new OTLPTraceExporter({
            url: credentials.getEndpoint(),
            credentials: grpcCredentials.createFromSecureContext(secureContext),
        })
    }
}
