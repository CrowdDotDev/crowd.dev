# LFX Community Management (formerly crowd.dev)
## Background
This project was formerly known as crowd.dev, a startup that was acquired by the Linux Foundation in April 2024. Since then, crowd.dev has been renamed "LFX Community Mangement".

## About this project
Community Management is a Customer Data Platform (CDP) that collects and stores customer data from various sources in a single database for data unification, identity resolution, analysis, and activation. By utilizing this tool, the Linux Foundation can effectively identify key contributors and organizations, facilitating more efficient community support.

Key features:
* It consolidates developers' touchpoints with a company or brand.
* It captures data from community platforms, product channels, and commercial channels.
* The data is cleaned, and profiles are matched across platforms and enriched with third-party data.
* The platform provides a unified 360-degree view of developers' engagement, their companies, and their customer journey.

Better data helps us better support our community members.

## Getting started

### Cloud version

Our <a href="https://app.crowd.dev/">cloud version</a> is a fast, easy, and free way to get started with crowd.dev.

### Self-hosted version

To get started with self-hosting, take a look at our [self-hosting docs](./technical-docs/development-and-deployment.md).

#### Integrations

We currently support all our integrations for self-hosting. For each one of them, you will need to create your own application.

### Development environment

#### <a name="requirements">Requirements</a>

- [Node](https://nodejs.org/en) v16.16.0
- [Docker](https://docs.docker.com/get-docker/) and [docker-compose](https://docs.docker.com/compose/install/)

#### <a name="getting_started">Getting started</a>

1. Get the mono repo from GitHub

```shell
git clone git@github.com:CrowdDotDev/crowd.dev.git
```

2. Run the start script

```shell
cd scripts
./cli start
```

For hot reloading, you can run

```shell
cd scripts
./cli clean-start-dev
```

This app will be available at http://localhost:8081

For more information on development, you can <a href="https://docs.crowd.dev/docs/docker-compose-single-machine-development-with-docker-images">check our docs</a>.

## Contribution

There are many ways you can contribute to crowd.dev! Here are a few options:

- Star this repo
- Create issues every time you feel something is missing or goes wrong
- Upvote issues with 👍 reaction so we know what's the demand for a particular issue to prioritize it within the roadmap

If you would like to contribute to the development of the project, please refer to our [Contributing guide](https://github.com/CrowdDotDev/crowd.dev/blob/main/CONTRIBUTING.md).

All contributions are highly appreciated. 🙏

## License

Distributed under the Apache 2.0 License. See `LICENSE` for more information.

## Security

We take security very seriously. If you come across any security vulnerabilities, please disclose them by sending an email to security@crowd.dev. We appreciate your help in making our platform as secure as possible and are committed to working with you to resolve any issues quickly and efficiently.
