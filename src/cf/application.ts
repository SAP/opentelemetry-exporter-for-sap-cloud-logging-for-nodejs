export class Application {

    private static readonly FIELD_APPLICATION_NAME = "application_name"
    private static readonly FIELD_APPLICATION_ID = "application_id"
    private static readonly FIELD_APPLICATION_URIS = "application_uris"
    private static readonly FIELD_NAME = "name"
    private static readonly FIELD_URIS = "uris"
    private static readonly FIELD_SPACE_NAME = "space_name"
    private static readonly FIELD_SPACE_ID = "space_id"
    private static readonly FIELD_ORGANIZATION_NAME = "organization_name"
    private static readonly FIELD_ORGANIZATION_ID = "organization_id"
    private static readonly FIELD_INSTANCE_INDEX = "instance_index"
    private static readonly FIELD_PROCESS_ID = "process_id"
    private static readonly FIELD_PROCESS_TYPE = "process_type"

    private applicationName?: string
    private applicationID?: string
    private applicationURIs?: string[]
    private name?: string
    private uris?: string[]
    private instanceIndex?: number
    private spaceName?: string
    private spaceID?: string
    private organizationName?: string
    private organizationID?: string
    private processID?: string
    private processType?: string

    private constructor() { }

    public static parse(data: any): Application {
        let app = new Application()
        app.applicationName = data[Application.FIELD_APPLICATION_NAME]
        app.applicationID = data[Application.FIELD_APPLICATION_ID]
        app.applicationURIs = data[Application.FIELD_APPLICATION_URIS]
        app.name = data[Application.FIELD_NAME]
        app.uris = data[Application.FIELD_URIS]
        app.instanceIndex = parseInt(data[Application.FIELD_INSTANCE_INDEX])
        app.spaceName = data[Application.FIELD_SPACE_NAME]
        app.spaceID = data[Application.FIELD_SPACE_ID]
        app.organizationName = data[Application.FIELD_ORGANIZATION_NAME]
        app.organizationID = data[Application.FIELD_ORGANIZATION_ID]
        app.processID = data[Application.FIELD_PROCESS_ID]
        app.processType = data[Application.FIELD_PROCESS_TYPE]
        return app
    }

    public getApplicationName(): string {
        return this.getStringOrEmpty(this.applicationName)
    }

    public getApplicationID(): string {
        return this.getStringOrEmpty(this.applicationID)
    }

    public getApplicationURIs(): string[] {
        return this.applicationURIs ? this.applicationURIs : []
    }

    public getName(): string {
        return this.getStringOrEmpty(this.name)
    }

    public getURIs(): string[] {
        return this.uris ? this.uris : []
    }

    public getInstanceIndex(): number {
        return !isNaN(this.instanceIndex!) ? this.instanceIndex! : -1
    }

    public getSpaceName(): string {
        return this.getStringOrEmpty(this.spaceName)
    }

    public getSpaceID(): string {
        return this.getStringOrEmpty(this.spaceID)
    }

    public getOrganizationName(): string {
        return this.getStringOrEmpty(this.organizationName)
    }

    public getOrganizationID(): string {
        return this.getStringOrEmpty(this.organizationID)
    }

    public getProcessID(): string {
        return this.getStringOrEmpty(this.processID)
    }

    public getProcessType(): string {
        return this.getStringOrEmpty(this.processType)
    }

    private getStringOrEmpty(value: string | undefined): string {
        return value ? value : ""
    }
}
