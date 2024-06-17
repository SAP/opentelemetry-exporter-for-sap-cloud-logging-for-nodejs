import { CloudLoggingServiceBindingsProvider } from "../../cf/cloudLoggingServiceBindingsProvider"
import { MultiMetricExporter } from "../multi/multiMetricExporter"
import { ServiceBinding } from "../../cf/serviceBinding"
import { CloudLoggingCredentials } from "../../cf/cloudLoggingCredentials"
import { createSecureContext } from 'tls'
import { credentials as grpcCredentials } from '@grpc/grpc-js'
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-grpc"
import { PushMetricExporter } from "@opentelemetry/sdk-metrics"

export class AutoCloudLoggingMetricsExporter extends MultiMetricExporter {
    public constructor(autoConfigExporters: Boolean = true) {
        super("AutoCloudLoggingMetricsExporter")
        if (autoConfigExporters) {
            this.setupExporters()
        }
    }

    private setupExporters() {
        let bindingsProvider = new CloudLoggingServiceBindingsProvider()
        let bindings = bindingsProvider.get()
        let exporters = bindings.map(binding => { return this.createExporterForBinding(binding) })
            .filter(exporter => exporter !== undefined) as PushMetricExporter[]
            this.diagLogger.info(`Setup AutoCloudLoggingMetricsExporter with ${exporters.length} exporter(s)`)
        this.add(...exporters)
    }

    private createExporterForBinding(binding: ServiceBinding): PushMetricExporter | undefined {
        let credentials = CloudLoggingCredentials.parse(binding.getCredentials())
        if (!credentials.validate()) {
            return undefined
        }

        let secureContext = createSecureContext({
            cert: credentials.getClientCert(),
            key: credentials.getClientKey()
        })

        this.diagLogger.info(`Creating OTLP metrics exporter for service binding '${binding.getName()}' (${binding.getLabel()})`)
        return new OTLPMetricExporter({
            url: credentials.getEndpoint(),
            credentials: grpcCredentials.createFromSecureContext(secureContext),
        })
    }
}
