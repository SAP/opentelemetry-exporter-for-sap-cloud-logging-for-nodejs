export class ServiceBinding {

    private serviceName: string
    private name: string
    private label: string
    private tags: string[]
    private credentials: any

    public constructor(serviceName: string, data: any) {
        this.serviceName = serviceName;
        this.name = data.name || ""
        this.label = data.label || ""
        this.credentials = data.credentials || {}
        this.tags = data.tags || []
    }

    public getServiceName(): string {
        return this.serviceName
    }

    public getName(): string {
        return this.name
    }

    public getLabel(): string {
        return this.label
    }

    public getCredentials(): any  {
        return this.credentials
    }

    public getTags(): string[] {
        return this.tags
    }
}
