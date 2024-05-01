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

- `api` (backend)
- `nango`
- `redis`

#### Config
Kubernetes requires the following configmaps. These config maps are not commited to the repository as they contain secerts. They are all contained in the `/scripts/deploy/kubernetes/.env-configmap.yaml` file.

- `backend-config`: the values from `../kubernetes/.backend.env`
- `frontend-config`: the values from `../kubernetes/.frontend.env`

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

### Prometheus
To access Prometheus locally, run

`kubectl port-forward svc/kube-prometheus-stack-prometheus 9090:9090 -n kube-prometheus-stack`

and then go to http://localhost:9090

### Grafana
To access Grafana locally, run

`kubectl port-forward svc/kube-prometheus-stack-grafana 3000:80 -n kube-prometheus-stack`

and then go to http://localhost:3000

The username is `admin` and the password is `prom-operator` or whatever is in the values file.