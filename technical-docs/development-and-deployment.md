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

To initiate all the services, use the command `./cli clean-start` only once. This command creates and stores data in Docker volumes. It's crucial to understand that running `./cli clean-start` again will result in the loss of all previously stored data because it reinitializes the services and their associated volumes from scratch.

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

### Machine specifications

For a single-machine deplpymnent, we recommend a Linux server, with at least 24GB of RAM and 8 cores 2Ghz CPU.

### Setting up integrations

Integrations will need to be set on a individual basis. You can check the guides on setting up integrations in our [integrations guide](integrations.md).
