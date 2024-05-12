# GetSphere Prod Deployment
This document has been written during the deployment of GetSphere.dev and may or may not be helpful to someone who is reading it who doesn't handle that deployment 🙂

# Build
The docker images are all built with the cli like this:

`./cli build frontend` or `./cli build-and-push frontend`

Which then users a Dockerfile and context file (env file) to build and publish the images to `liscioapps/sphere-{service}` on Dockerhub. For many of the files, this will include a tag that has the epoch time and current commit hash, which is then (currently) hardcoded in to the k8s yaml files for deployment.

# Deployment

## General Workflow
The general workflow deploying or redploying a service is:

Build and tag image -> Push to Docker Hub -> Update Kubernetes deployment to new tag -> Re-apply deployment yaml

So, for example to change the backend service (api service) we would:

- Make the code changes
- Go to ./scripts
- Run `./cli build-and-push backend`
- Update the `app.yaml` with the new tag from the `Pushing image liscioapps/sphere...` line
- Go to ./scripts/kubernetes
- Run `kubectl apply -f api.yaml`
- Observe the line `deployment.apps/api-dpl configured`
- Observe K8s automatically recared the pod `api-dpl-{guid}`

## Endpoints

- app.getsphere.dev
- nango.getsphere.dev

## DigitalOcean
The services in place in DigitalOcean are:

- `getsphere-k8s`: Kubernetes Cluster
- `getsphere-db-13`: Production PostgresDB

### Kubernetes
The following services run in Kubernetes:

```bash
├── api.yaml                    Backend API
├── cubejs.yaml                 CubeJS
├── datadog-values.yaml         Used to install datadog (see below)
├── discord-ws.yaml             Discord Web Socket service
├── do-nginx.yaml               Ingress for DigitalOcean
├── elasticmq.yaml              SQS for messaging
├── frontend.yaml               Vue Frontend
├── ingress.yaml                Ingress for the app
├── job-generator.yaml          Job Generator service
├── kube-prometheus-stack-values.yaml   Used to install the kube-prometheus-stack (see below)
├── letsencrypt.yaml            Used to get ceritificates for all the external facing services
├── nango.yaml                  Nango
├── nodejs-worker.yaml          NodeJS Worker
├── opensearch.yaml             OpenSearch for search and indexing
├── python-worker.yaml          Python Worker
├── redis.yaml                  Redis
├── search-sync-api.yaml        Search sync API
├── search-sync-script-runner.yaml      Search Sync script runner (not intended to be deployed forever)
├── search-sync-worker.yaml     Search sync worker(s)
├── temporal.yaml               Temporal for messaging
├── unleash.yaml                Unleash
├── webhook-api.yaml            Webhook API services
└── workers.yaml                Various workers (lots of bespoke worker services)
```

#### Config
Kubernetes requires the following configmaps. These config maps are not commited to the repository as they contain secerts.

- `backend-config`: the values from `../kubernetes/.backend.env`
- `frontend-config`: the values from `../kubernetes/.frontend.env`

To update these, download the latest files to the ignored config files by:

- `cd scripts/deploy/kubernetes`
- `kubectl get  configmaps backend-config -o yaml > .backend-config.yaml`
- `kubectl get  configmaps frontend-config -o yaml > .frontend-config.yaml`
- Modify the files as needed
- `kubectl apply -f .backend-config.yaml`
- `kubectl apply -f .frontend-config.yaml`

## Service Notes

### API
This is the `/backend` project that runs the main API for the GetSphere software

### Nango
This is the Nango open source software that assists with some integrations. It has a separate part of the database that it uses to track items it is responsible for and thus needs direct database access.

It is also publically accessable at nango.getsphere.dev to handle OAuth for the integrations it is responsible for.

TODO: Write about what integrations it is responsible for

### Redis
Redis is deployed as a standalone service

TODO: What is redis used for exactly

### OpenSearch
???

### Ingress & Related Services
#### letsencrypt
This is not a deploymnet but a ClusterIssuer that allows us to have letsencrypt issue certificates for our ingress endpoints.

To install this, you first have to [install the CRDs for cert-manager](https://cert-manager.io/docs/installation/).

#### ingress
This adds the nginx ingress for all of the Endpoints listed above. For DigitalOcean you also have to [install the ingress controller](https://kubernetes.github.io/ingress-nginx/deploy/#digital-ocean) with the command below

`kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.10.1/deploy/static/provider/do/deploy.yaml`

These pods and services for NGINX will run in the `ingress-nginx` namespace.

We've customized some of that setup in `do-nginx.yaml`

# Monitoring

## Datadog
Datadog monitoring is enabled through the [Datadog operator helm chart]() using the values file at `./scrips/deploy/kubernetes/datadog-values.yaml`

To update or upgrade it, change the values as desired and run

`helm upgrade datadog-agent -f datadog-values.yaml datadog/datadog`

## Kube Prometheus Stack
The [kube-prometheus-stack]() helm chart was automatically installed via DigitalOcean, but can also have the values tweaked in `./scripes/deploy/kubernetes/kube-prometheus-stack.yaml`

Installed with:

```bash
helm upgrade kube-prometheus-stack prometheus-community/kube-prometheus-stack --version 55.7.0 \
  --namespace kube-prometheus-stack \
  --values kube-prometheus-stack-values.yaml
```

### Prometheus
To access Prometheus locally, run

`kubectl port-forward svc/kube-prometheus-stack-prometheus 9090:9090 -n kube-prometheus-stack`

or

`kubectl port-forward --address 0.0.0.0 svc/kube-prometheus-stack-prometheus 9090:9090 -n kube-prometheus-stack`

and then go to http://localhost:9090

### Grafana
To access Grafana locally, run

`kubectl port-forward svc/kube-prometheus-stack-grafana 3000:80 -n kube-prometheus-stack`

or

`kubectl port-forward --address 0.0.0.0 svc/kube-prometheus-stack-grafana 3000:80 -n kube-prometheus-stack`

and then go to http://localhost:3000

The username is `admin` and the password is `prom-operator` or whatever is in the values file.