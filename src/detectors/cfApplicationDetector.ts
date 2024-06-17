import { Attributes } from '@opentelemetry/api';
import { DetectorSync, IResource, ResourceDetectionConfig, Resource } from '@opentelemetry/resources';
import { ApplicationProvider } from '../cf/applicationProvider';

export class CFApplicationDetector implements DetectorSync {
    attributes: Attributes;

    constructor() {
        let provider = new ApplicationProvider()
        let app = provider.get()

        if (app) {
            this.attributes = {
                ["service.name"]: app.getApplicationName(),
                ["sap.cf.source_id"]: app.getApplicationID(),
                ["sap.cf.instance_id"]: app.getInstanceIndex(),
                ["sap.cf.app_id"]: app.getApplicationID(),
                ["sap.cf.app_name"]: app.getApplicationName(),
                ["sap.cf.space_id"]: app.getSpaceID(),
                ["sap.cf.space_name"]: app.getSpaceName(),
                ["sap.cf.org_id"]: app.getOrganizationID(),
                ["sap.cf.org_name"]: app.getOrganizationName(),
                ["sap.cf.process.id"]: app.getProcessID(),
                ["sap.cf.process.type"]: app.getProcessType(),
            }
        } else {
            this.attributes = {}
        }
    }

    detect(config?: ResourceDetectionConfig | undefined): IResource {
        return new Resource(this.attributes);
    }
}
