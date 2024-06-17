import { diag, DiagLogger } from '@opentelemetry/api'

export class CloudLoggingCredentials {
    
    private static readonly CRED_OTLP_ENDPOINT = "ingest-otlp-endpoint" 
    private static readonly CRED_OTLP_CLIENT_KEY = "ingest-otlp-key" 
    private static readonly CRED_OTLP_CLIENT_CERT = "ingest-otlp-cert" 
    private static readonly CRED_OTLP_SERVER_CERT = "server-ca" 
    private static readonly CLOUD_LOGGING_ENDPOINT_PREFIX = "https://"

    private diagLogger: DiagLogger
    private endpoint?: String
    private clientKey?: Buffer
    private clientCert?: Buffer
    private serverCert?: Buffer

    private constructor() {
        this.diagLogger = diag.createComponentLogger({
            namespace: "CloudLoggingCredentials"
        })
    }

    public static parse(credentials: any): CloudLoggingCredentials {
        let parsed = new CloudLoggingCredentials()

        parsed.endpoint = credentials[CloudLoggingCredentials.CRED_OTLP_ENDPOINT]
        parsed.clientKey = Buffer.from(credentials[CloudLoggingCredentials.CRED_OTLP_CLIENT_KEY], "utf-8")
        parsed.clientCert = Buffer.from(credentials[CloudLoggingCredentials.CRED_OTLP_CLIENT_CERT], "utf-8")
        parsed.serverCert = Buffer.from(credentials[CloudLoggingCredentials.CRED_OTLP_SERVER_CERT], "utf-8")

        return parsed
    }

    public validate(): boolean {
        if (this.isUndefinedOrEmpty(this.endpoint)) {
            this.diagLogger.warn(`Credential "${CloudLoggingCredentials.CRED_OTLP_ENDPOINT}" not found. Skipping cloud-logging exporter configuration.`)
            return false
        }
        if (this.isUndefinedOrEmpty(this.clientKey)) {
            this.diagLogger.warn(`Credential "${CloudLoggingCredentials.CRED_OTLP_CLIENT_KEY}" not found. Skipping cloud-logging exporter configuration.`)
            return false
        }
        if (this.isUndefinedOrEmpty(this.clientCert)) {
            this.diagLogger.warn(`Credential "${CloudLoggingCredentials.CRED_OTLP_CLIENT_CERT}" not found. Skipping cloud-logging exporter configuration.`)
            return false
        }
        if (this.isUndefinedOrEmpty(this.serverCert)) {
            this.diagLogger.warn(`Credential "${CloudLoggingCredentials.CRED_OTLP_SERVER_CERT}" not found. Skipping cloud-logging exporter configuration.`)
            return false
        }
        return true
    }

    private isUndefinedOrEmpty(value: String | Buffer | undefined): boolean {
        if (value === undefined) {
            return true
        }
        if (value.length == 0) {
            return true
        }
        return false
    }

    public getEndpoint(): string {
        return CloudLoggingCredentials.CLOUD_LOGGING_ENDPOINT_PREFIX + this.endpoint!;
    }

    public getClientKey(): Buffer {
        return this.clientKey!
    }

    public getClientCert(): Buffer {
        return this.clientCert!
    }

    public getServerCert(): Buffer {
        return this.serverCert!
    }
}
