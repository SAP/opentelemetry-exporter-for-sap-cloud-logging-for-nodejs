import { ServiceBindingsProvider } from "./serviceBindingsProvider"
import { ServiceBinding } from "./serviceBinding"

export class CloudLoggingServiceBindingsProvider {

    private static DEFAULT_USER_PROVIDED_LABEL = "user-provided"
    private static DEFAULT_CLOUD_LOGGING_LABEL = "cloud-logging"
    private static DEFAULT_CLOUD_LOGGING_TAG = "Cloud Logging"

    private bindings: Array<ServiceBinding>    

    public constructor() {
        let cfServiceBindingsProvider = new ServiceBindingsProvider()
        let clsBindings = cfServiceBindingsProvider.get().filter((binding) => { return binding.getLabel() == CloudLoggingServiceBindingsProvider.DEFAULT_CLOUD_LOGGING_LABEL})
        let upsBindings = cfServiceBindingsProvider.get().filter((binding) => { return binding.getLabel() == CloudLoggingServiceBindingsProvider.DEFAULT_USER_PROVIDED_LABEL})
        this.bindings = [...clsBindings, ...upsBindings].filter((binding) => binding.getTags().includes(CloudLoggingServiceBindingsProvider.DEFAULT_CLOUD_LOGGING_TAG))
    }

    public get(): Array<ServiceBinding> {
        return this.bindings
    }
}
