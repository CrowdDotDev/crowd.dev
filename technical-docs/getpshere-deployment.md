# GetSphere Prod Deployment
This document has been written during the deployment of GetSphere.dev and may or may not be helpful to someone who is reading it who doesn't handle that deployment 🙂

# Build
The docker images are all built with the cli like this:

`./cli build frontend` or `./cli build-and-push frontend`

Which then users a Dockerfile and context file (env file) to build and publish the images to `liscioapps/sphere-{service}` on Dockerhub. For many of the files, this will include a tag that has the epoch time and current commit hash, which is then (currently) hardcoded in to the k8s yaml files for deployment.

# Deployment

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