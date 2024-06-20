# Table of contents

- [Local development](#local-development)
- [Production deployment](#production-deployment)
- [High-load deployment with Kubernetes](#high-load-deployment)

# Local development

## Prerequisites

Before diving into the setup, please ensure you have the following installed on your machine:

- Docker
- Docker Compose (available as a Docker plugin)

These tools are crucial for running our services in isolated containers, ensuring a smooth development experience.

## Understanding the Project Structure

Our project comprises several key files and directories that orchestrate the setup and management of our services:

- **`scripts/scaffold.yaml`**: Contains Docker Compose specifications for dependency services like databases, message queues, and temporal servers.
- **`scripts/cli`**: A CLI script for starting, stopping, and managing services.
- **`scripts/services/*.yaml`**: Docker Compose files for our individual services. Each file specifies how to run a specific service, e.g., `api.yaml` for the API service.
- **`scripts/services/docker`**: Houses Dockerfiles for building our services.

**Environment Configuration Files**:

- `frontend/.env.dist.composed` and `frontend/.env.dist.local`: Environment variables for the frontend service. `.dist.composed` files are used when running inside Docker, while `.dist.local` files are for local runs.
- `backend/.env.dist.composed` and `backend/.env.dist.local`: Similar to frontend, these files contain environment variables for the backend service.

When starting `cli` for the first time it also creates these env files for you:

- `backend/.env.override.local`
- `backend/.env.override.composed`
- `frontend/.env.override.local`
- `frontend/.env.override.composed`

These come in handy so you don't need to change the `dist` env files which can be changed by us. All your config changes should go in the `override` files.

## Starting Services for Development

### Setting Up the Environment

If you want to run services outside of docker you need to export `.env.dist.local` and `.env.dist.override` files into your environment and then start the service. If you are starting services using our CLI they will be started in a docker container using all env files in this order:

1. `.env.dist.local`
2. `.env.dist.composed`
3. `.env.override.local`
4. `.env.override.composed`

So next file can override the previous one by setting the same env variable.

Please configure your desired integrations (like github, slack, discord...) in override env files otherwise you wont be able to use them.

### Using the CLI Script

Our CLI script is your go-to tool for managing the services. Here are some commands specifically tailored for development purposes:

#### Starting All Services

To start all services, including dependency services defined in `scripts/scaffold.yaml`, use:

```bash
./cli clean-start-dev
```

This command initiates services in development mode with hot reload enabled, allowing you to see code changes reflected in real-time without restarting the services.
This starts everything that you need from scratch, deleting any data from the previous start.

Web application will be available on [http://localhost:8081](http://localhost:8081).

#### Manipulating Scaffold Services

Scaffold services are auxiliary services your application depends on. They are started by `./cli clean-start-dev` but you can still manage them individuallty using:

- **Start Scaffold Services**: `./cli scaffold up`
- **Stop Scaffold Services**: `./cli scaffold down`
- **Destroy Scaffold Services**: `./cli scaffold destroy` (This also deletes all Docker volumes, clearing all data.)
- **Reset Scaffold Services**: `./cli scaffold reset` (Destroys and then starts the scaffold services afresh.)

#### Managing Individual Services

To control specific services, use the following commands, replacing `<service-name>` with the name of the service you wish to manage:

- **Start a Service**: `./cli service <service-name> up`
- **Stop a Service**: `./cli service <service-name> down`
- **View Service Logs**: `./cli service <service-name> logs`
- **Restart a Service**: `./cli service <service-name> restart`

Enable development mode with hot reload by setting the `DEV=1` environment variable before executing these commands. This only works with our services and not scaffold service

# Production deployment

## Single machine deployment

### Domain & SSL settings

If you want to host our app so that it is publicly available on the internet you need to do some extra configuration work before you start any service.

#### Services to expose

Here is a list of services that need to be available publicly.

- CubeJS running on port 4000
- Nango running on port 3003
- our frontend service running on port 8081

For instance if you want to host our app at domain `crowd.yourdomain.com` lets say these are the urls:

- CubeJS - `cubejs.crowd.yourdomain.com`
- Nango - `nango.crowd.yourdomain.com`
- our frontend - `crowd.yourdomain.com`

#### Configuration changes

You need to make changes to frontend and backend env. configuration files:

- `frontend/.env.override.local`

```
# If you decided to use SSL use wss instead of ws
VUE_APP_WEBSOCKETS_URL=ws://crowd.yourdomain.com

# Where the frontend is hosted (use https instead of http if you are using SSL)
VUE_APP_FRONTEND_HOST=crowd.yourdomain.com
VUE_APP_FRONTEND_PROTOCOL=http

# Where CubeJS is hosted (use https instead of http if you are using SSL)
VUE_APP_CUBEJS_URL=http://nango.crowd.yourdomain.com

# Where Nango is hosted (use https instead of http if you are using SSL)
VUE_APP_NANGO_URL=http://nango.crowd.yourdomain.com
```

- `backend/.env.override.local`

```
# Only users with emails from this domain can sign up
CROWD_SIGNUP_DOMAIN=yourdomain.com

# API service URL (use https instead of http if you are using SSL)
CROWD_API_URL=http://crowd.yourdomain.com/api

# Frontend service URL (use https instead of http if you are using SSL)
CROWD_API_FRONTEND_URL=http://crowd.yourdomain.com
```

And some changes to `scripts/scaffold.yaml` docker compose file so that `nango` service will know where it's hosted:

- find `NANGO_CALLBACK_URL` and change it to `http://nango.crowd.yourdomain.com/oauth/callback` (use https if needed)
- find `NANGO_SERVER_URL` and change it to `http://nango.crowd.yourdomain.com` (use https if needed)

Now depending on if you want to use SSL or not we prepared two options here:

##### SSL Nginx configuration

Your website is running at `crowd.yourdomain.com` on port 443 (https) with encryption.

- copy `scripts/scaffold/ssl.default.conf.template` to `scripts/scaffold/templates/default.conf.template` overwritting the existing file
- currently the file is set up to host on `*.yourdomain.com` so please open it up and change all occurances to your domain (see `server_name`)
- place your SSL certificate and key file in PEM format into `scripts/scaffold/nginx/ssl` folder named `cert.pem` and `key.pem`.

##### No SSL Nginx configuration (not recommended)

Your website is running at `crowd.yourdomain.com` on port 80 (http) without encryption.

- copy `scripts/scaffold/nossl.default.conf.template` to `scripts/scaffold/templates/default.conf.template` overwritting the existing file
- currently the file is set up to host on `*.yourdomain.com` so please open it up and change all occurances to your domain (see `server_name`)
- open up `scripts/scaffold.yaml` and find `nginx` service and change ports to be `80:80` instead of `443:443`

### Machine specifications

For a single-machine deplpymnent, we recommend a Linux server, with at least 24GB of RAM and 8 cores 2Ghz CPU.

### Deploying services

Clone the code into your machine. To initiate all the services, use the command `./cli clean-start`. This command creates and stores data in Docker volumes. It's crucial to understand that running `./cli clean-start` again will result in the loss of all previously stored data because it reinitializes the services and their associated volumes from scratch.

In scenarios where your server encounters an issue and requires a restart without losing existing data, you should opt for `./cli start`. This command ensures that your services are rebooted using the existing data stored in Docker volumes, thus preserving your data integrity.

After the command is run, the application will be available on [http://localhost:8081](http://localhost:8081).

This, however, will start the PostgreSQL and OpenSearch dependencies running together with all other services in a docker container. We recommend that you provide your own PostgreSQL and OpenSearch for a production deployment. To do so, first comment them out in `scripts/scaffold.yaml`. Then, provide configuration in the `backend/.env.override.local`.

To provide your own PostgreSQL instance you should:

1. Comment out `db` service in `scripts/scaffold.yaml` docker compose file. This can be done by adding a `#` before the `db` service definition:
   ```yaml
   # db:
   #   image: postgres:13.6-alpine
   #   ...
   ```
2. Configure database environment variables in `backend/.env.override.local`:
   ```
   # DB settings
   CROWD_DB_WRITE_HOST=write_host
   CROWD_DB_READ_HOST=read_host  # if you only have one replica, use the write
   CROWD_DB_PORT=port
   CROWD_DB_USERNAME=username
   CROWD_DB_PASSWORD=password
   CROWD_DB_DATABASE=database
   ```
3. Configure CubeJS and Nango to use the new database in `scripts/scaffold.yaml`. Search for `cubejs` and `nango` and replace the following variables:

   ```yaml
   cubejs:
     environment:
       - CUBEJS_DB_HOST=db
       - CUBEJS_DB_PORT=5432
       - CUBEJS_DB_NAME=crowd-web
       - CUBEJS_DB_USER=postgres
       - CUBEJS_DB_PASS=example
   nango:
     environment:
       - NANGO_DB_HOST=write_host
       - NANGO_DB_PORT=port
       - NANGO_DB_NAME=database
       - NANGO_DB_USER=user
       - NANGO_DB_PASSWORD=password
   ```

4. To initialize the database schema, export the environment variables and then run `./cli migrate-env`. Here's an example of how to do this in a bash shell:

   ```bash
   export CROWD_DB_WRITE_HOST=write_host
   export CROWD_DB_READ_HOST=read_host
   export CROWD_DB_PORT=port
   export CROWD_DB_USERNAME=username
   export CROWD_DB_PASSWORD=password
   export CROWD_DB_DATABASE=database
   ./cli migrate-env
   ```

5. After that you can start services normally with `./cli clean-start`. After a few minutes, the web application should be running at [http://localhost:8081](http://localhost:8081).

### Setting up integrations

Integrations will need to be set on a individual basis. Please refer to the [guides on setting up integrations](integrations.md).

# High-load deployment with Kubernetes

For high data loads, we recommend deployment using Kubernetes with a dedicated PostgreSQL database and OpenSearch cluster. The main files for handling these resources are:

- `scripts/scaffold.yaml` docker compose file
- `scripts/services/*.yaml` docker compose files and
- `scripts/services/docker` docker image build files

For most people, deploying like this will not be needed. For those who needed, an engineer with DevOps and Kubernetes experience will be required to maintain the deployment. How to carry out the deployment will vary on a case-by-case basis, and we are available to help with these advanced scenarios until 30th of June 2024.
