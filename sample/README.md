# Sample App for Auto-Configured Exporters

A minimal sample demonstrating the auto-configured OpenTelemetry exporters for SAP Cloud Logging.

## Run on Cloud Foundry

Install dependencies and build the app before pushing it to a Cloud Foundry org/space:

```bash
# install dependencies and build app
npm i && npm run build

# login
cf login --sso

# select an org and space
cf target -o ORG_NAME -s SPACE_NAME 

# push to selected CF org and space
cf push
```

Afterwards you can create a service binding to a new or existing SAP CLoud Logging instance with enabled OTLP ingest.
Visit the route assigned to the app to generate some traffic.
Logs, metrics and traces should become available in the respective OpenTelemetry indices shortly afterwards.
