<!-- PROJECT LOGO -->
<p align="center">
  <a href="https://github.com/CrowdDotDev/crowd.dev">  </a>

  <img src="https://github.com/CrowdDotDev/crowd.dev/assets/41432658/e5970c3a-095c-46ea-b93b-eb517bcd8a4f" alt="crowd.dev icon" width="120px">


  <h2 align="center">Effortlessly centralize community, product, and customer data</h2>
  
  <p align="center">
    <br>
    <a href="https://crowd.dev/sign-up">🌐 Cloud version (beta)</a>
    ·
    <a href="https://docs.crowd.dev">📖 Docs</a>
    ·
    <a href="https://crowd.dev/discord">❤️ Discord</a>
    ·
    <a href="https://crowd.dev/newsletter-sign-up">📣 Newsletter</a>
    ·
    <a href="https://crowd.dev/roadmap">🗺️ Roadmap</a>
  </p>
</p>

<br>

<!-- BODY -->

<img src="https://github.com/CrowdDotDev/crowd.dev/assets/22342669/845fc5b0-aba7-40fe-950e-85ef567cec65" alt="UI Home screen">


## Table of Contents
- [About crowd.dev](#about-crowddev)
- [Features](#features)
- [Getting started](#getting-started)
- [Roadmap](#roadmap)
- [Stay up-to-date](#stay-up-to-date)
- [Contribution](#contribution)
- [License](#license)
- [Security](#security)
- [Book a call](#book-a-call)

## About crowd.dev
crowd.dev is the Developer Data Platform(DDP) that enables companies to centralize all the touchpoints developers have with their product and brand. These touchpoints can be in the community (e.g., Stack Overflow or Reddit), product (open-source or SaaS), or commercial channels (e.g., HubSpot). The platform retrieves data from various sources, normalizes it, matches identities across platforms, and enriches it with third-party data. The result is a unified 360-degree view of the developers who engage with your product and community, the companies they work for, and their position in their personal customer journey. 

crowd.dev is open-source, built with developers in mind, available for both hosted and self-hosted deployments, open to extensions, and offers full control over your data. 

**To our **users**:**
- You can actively get involved, contribute to our roadmap, and shape crowd.dev into the tool you've always wanted.
- We are open about what we are building, allowing you to take a look inside and ensuring that we handle your data in a privacy-preserving way.
- Our interests as a company are aligned with yours, and we aim to consistently deliver sufficient value to you with our commercial offering in relation to our pricing.

**To our developer community:**
- You can self-host crowd.dev to centralize data for your community or company while maintaining full control over your data.
- Our product is designed for extensibility. If you can think of any use cases that you want to build with the data we collect and store for you, please go ahead and build them! We will be here to help out if you need assistance.
- You can actively contribute to crowd.dev (e.g., integrations), and we will support you along the journey. Just refer to our [Contributing guide](https://github.com/CrowdDotDev/crowd.dev/blob/main/CONTRIBUTING.md) for guidance.

## Features

- **Plug & play integrations** to connect all relevant platforms, such as GitHub, Discord, Slack, or LinkedIn ([all integrations](https://www.crowd.dev/integrations)).
- **Identity resolution & automated segmentation** to effortlessly understand activities and profiles across platforms.
- **Opinionated analytics & reports** on topics like product-market-fit and open-source community activity to further inform your GTM strategy.
- **Workflows automation** with webhooks.
- **2-way CRM sync & Slack alerts** to recieve real-time notifications about intent events [cloud only].
- **User enrichment** with 25+ attributes, including emails, social profiles, work experience, and technical skills [cloud only].
- **Organization enrichment** with 50+ attributes, including industry, headcount, and revenue [cloud only].
- **Sentiment analysis and conversation detection** to stay informed about what's happening in your open-source community [cloud only].
- **[Eagle Eye](https://www.crowd.dev/eagle-eye)**: Monitor developer-focused community platforms to find relevant content to engage with, helping you to gain developers’ mindshare and grow your community organically [cloud only].


## Getting started

### Cloud version

Our <a href="https://app.crowd.dev/">cloud version</a> offers a fast, easy, and free way to begin using crowd.dev.

### Self-hosted version

To get started with self-hosting, take a look at our [self-hosting docs](https://docs.crowd.dev/docs/getting-started-with-self-hosting).

#### Deployment with Kubernetes

Our services can be deployed using Kubernetes, as well as a lightweight development environment using Docker. You can read more about it in our [self-hosting docs](https://docs.crowd.dev/docs/deployment).

#### Integrations

We currently support all our integrations for self-hosting. For each one of them, you will need to create your own application. You can see the steps for each integration in our [self-hosting integrations guide](https://docs.crowd.dev/docs/self-hosting).

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

## Roadmap

You can find more features on our [public roadmap](https://crowd.dev/roadmap). Feel free to also [open an issue](https://crowd.dev/open-an-issue) for anything you're missing.


## Stay up-to-date

crowd.dev is still in beta and we ship new features every week. To stay in the loop, leave us a star and subscribe to our <a href="https://crowd.dev/newsletter-sign-up">monthly newsletter</a>. Thanks a lot! ❤️


## Contribution

There are various ways you can contribute to crowd.dev! Here are a few options:

- Star this repository.
- Create issues whenever you feel something is missing or goes wrong.
- Upvote issues with a 👍 reaction so we know what's the demand for a particular issue and can prioritize it within the roadmap.

If you'd like to contribute to the development of the project, please refer to our [Contributing guide](https://github.com/CrowdDotDev/crowd.dev/blob/main/CONTRIBUTING.md).

All contributions are highly appreciated. 🙏

## License

Distributed under the Apache 2.0 License. See `LICENSE` for more information.

Our self-hosted version can be run and deployed by default under the permissive Apache 2.0 license. All premium components will be hidden and inactive with the default configuration. You can run, deploy, and contribute to the app without worrying about violating the premium license. Check out the [premium self-hosted features docs](https://docs.crowd.dev/docs/premium-self-hosted-apps) to learn more about the premium self-hosted features.

## 🔒 Security

We take security very seriously. If you come across any security vulnerabilities, please disclose them by sending an email to security@crowd.dev. We appreciate your help in making our platform as secure as possible and are committed to working with you to resolve any issues quickly and efficiently.

## 📞 Book a call

Schedule a call with a crowd.dev team member to learn more about our product and ensure you get the most out of it.

<a href="https://cal.com/team/CrowdDotDev/intro-to-crowd-dev/"><img alt="Book us with Cal.com" src="https://cal.com/book-with-cal-dark.svg" /></a>
<!-- PROJECT LOGO -->
<p align="center">
  <a href="https://github.com/CrowdDotDev/crowd.dev">  </a>

  <img src="https://github.com/CrowdDotDev/crowd.dev/assets/41432658/e5970c3a-095c-46ea-b93b-eb517bcd8a4f" alt="crowd.dev icon" width="120px">


  <h2 align="center">Effortlessly centralize community, product, and customer data</h2>
  
  <p align="center">
    <br>
    <a href="https://crowd.dev/sign-up">🌐 Cloud version (beta)</a>
    ·
    <a href="https://docs.crowd.dev">📖 Docs</a>
    ·
    <a href="https://crowd.dev/discord">❤️ Discord</a>
    ·
    <a href="https://crowd.dev/newsletter-sign-up">📣 Newsletter</a>
    ·
    <a href="https://crowd.dev/roadmap">🗺️ Roadmap</a>
  </p>
</p>

<br>

<!-- BODY -->

<img src="https://github.com/CrowdDotDev/crowd.dev/assets/22342669/845fc5b0-aba7-40fe-950e-85ef567cec65" alt="UI Home screen">


## Table of Contents
- [About crowd.dev](#about-crowddev)
- [Features](#✨-features)
- [Getting started](#🚀-getting-started)
- [Roadmap](#🗺️-roadmap)
- [Stay up-to-date](#🔔-stay-up-to-date)
- [Contribution](#✍️-contribution)
- [License](#⚖️-license)
- [Security](#🔒-security)
- [Book a call](#📞-book-a-call)

## About crowd.dev
crowd.dev is the Developer Data Platform(DDP) that enables companies to centralize all the touchpoints developers have with their product and brand. These touchpoints can be in the community (e.g., Stack Overflow or Reddit), product (open-source or SaaS), or commercial channels (e.g., HubSpot). The platform retrieves data from various sources, normalizes it, matches identities across platforms, and enriches it with third-party data. The result is a unified 360-degree view of the developers who engage with your product and community, the companies they work for, and their position in their personal customer journey. 

crowd.dev is open-source, built with developers in mind, available for both hosted and self-hosted deployments, open to extensions, and offers full control over your data. 

**To our **users**:**
- You can actively get involved, contribute to our roadmap, and shape crowd.dev into the tool you've always wanted.
- We are open about what we are building, allowing you to take a look inside and ensuring that we handle your data in a privacy-preserving way.
- Our interests as a company are aligned with yours, and we aim to consistently deliver sufficient value to you with our commercial offering in relation to our pricing.

**To our developer community:**
- You can self-host crowd.dev to centralize data for your community or company while maintaining full control over your data.
- Our product is designed for extensibility. If you can think of any use cases that you want to build with the data we collect and store for you, please go ahead and build them! We will be here to help out if you need assistance.
- You can actively contribute to crowd.dev (e.g., integrations), and we will support you along the journey. Just refer to our [Contributing guide](https://github.com/CrowdDotDev/crowd.dev/blob/main/CONTRIBUTING.md) for guidance.

## ✨ Features

- **Plug & play integrations** to connect all relevant platforms, such as GitHub, Discord, Slack, or LinkedIn ([all integrations](https://www.crowd.dev/integrations)).
- **Identity resolution & automated segmentation** to effortlessly understand activities and profiles across platforms.
- **Opinionated analytics & reports** on topics like product-market-fit and open-source community activity to further inform your GTM strategy.
- **Workflows automation** with webhooks.
- **2-way CRM sync & Slack alerts** to recieve real-time notifications about intent events [cloud only].
- **User enrichment** with 25+ attributes, including emails, social profiles, work experience, and technical skills [cloud only].
- **Organization enrichment** with 50+ attributes, including industry, headcount, and revenue [cloud only].
- **Sentiment analysis and conversation detection** to stay informed about what's happening in your open-source community [cloud only].
- **[Eagle Eye](https://www.crowd.dev/eagle-eye)**: Monitor developer-focused community platforms to find relevant content to engage with, helping you to gain developers’ mindshare and grow your community organically [cloud only].


## 🚀 Getting started

### Cloud version

Our <a href="https://app.crowd.dev/">cloud version</a> offers a fast, easy, and free way to begin using crowd.dev.

### Self-hosted version

To get started with self-hosting, take a look at our [self-hosting docs](https://docs.crowd.dev/docs/getting-started-with-self-hosting).

#### Deployment with Kubernetes

Our services can be deployed using Kubernetes, as well as a lightweight development environment using Docker. You can read more about it in our [self-hosting docs](https://docs.crowd.dev/docs/deployment).

#### Integrations

We currently support all our integrations for self-hosting. For each one of them, you will need to create your own application. You can see the steps for each integration in our [self-hosting integrations guide](https://docs.crowd.dev/docs/self-hosting).

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

## 🗺️ Roadmap

You can find more features on our [public roadmap](https://crowd.dev/roadmap). Feel free to also [open an issue](https://crowd.dev/open-an-issue) for anything you're missing.


## 🔔 Stay up-to-date

crowd.dev is still in beta and we ship new features every week. To stay in the loop, leave us a star and subscribe to our <a href="https://crowd.dev/newsletter-sign-up">monthly newsletter</a>. Thanks a lot! ❤️


## ✍️ Contribution

There are various ways you can contribute to crowd.dev! Here are a few options:

- Star this repository.
- Create issues whenever you feel something is missing or goes wrong.
- Upvote issues with a 👍 reaction so we know what's the demand for a particular issue and can prioritize it within the roadmap.

If you'd like to contribute to the development of the project, please refer to our [Contributing guide](https://github.com/CrowdDotDev/crowd.dev/blob/main/CONTRIBUTING.md).

All contributions are highly appreciated. 🙏

## ⚖️ License

Distributed under the Apache 2.0 License. See `LICENSE` for more information.

Our self-hosted version can be run and deployed by default under the permissive Apache 2.0 license. All premium components will be hidden and inactive with the default configuration. You can run, deploy, and contribute to the app without worrying about violating the premium license. Check out the [premium self-hosted features docs](https://docs.crowd.dev/docs/premium-self-hosted-apps) to learn more about the premium self-hosted features.

## 🔒 Security

We take security very seriously. If you come across any security vulnerabilities, please disclose them by sending an email to security@crowd.dev. We appreciate your help in making our platform as secure as possible and are committed to working with you to resolve any issues quickly and efficiently.

## 📞 Book a call

Schedule a call with a crowd.dev team member to learn more about our product and ensure you get the most out of it.

<a href="https://cal.com/team/CrowdDotDev/intro-to-crowd-dev/"><img alt="Book us with Cal.com" src="https://cal.com/book-with-cal-dark.svg" /></a>
<!-- PROJECT LOGO -->
<p align="center">
  <a href="https://github.com/CrowdDotDev/crowd.dev">  </a>

  <img src="https://github.com/CrowdDotDev/crowd.dev/assets/41432658/e5970c3a-095c-46ea-b93b-eb517bcd8a4f" alt="crowd.dev icon" width="120px">


  <h2 align="center">Effortlessly centralize community, product, and customer data</h2>
  
  <p align="center">
    <br>
    <a href="https://crowd.dev/sign-up">🌐 Cloud version (beta)</a>
    ·
    <a href="https://docs.crowd.dev">📖 Docs</a>
    ·
    <a href="https://crowd.dev/discord">❤️ Discord</a>
    ·
    <a href="https://crowd.dev/newsletter-sign-up">📣 Newsletter</a>
    ·
    <a href="https://crowd.dev/roadmap">🗺️ Roadmap</a>
  </p>
</p>

<br>

<!-- BODY -->

<img src="https://github.com/CrowdDotDev/crowd.dev/assets/22342669/845fc5b0-aba7-40fe-950e-85ef567cec65" alt="UI Home screen">


## Table of Contents
- [About crowd.dev](#about-crowddev)
- [Features](#✨-features)
- [Getting started](#🚀-getting-started)
- [Roadmap](#🗺️-roadmap)
- [Stay up-to-date](#🔔-stay-up-to-date)
- [Contribution](#✍️-contribution)
- [License](#⚖️-license)
- [Security](#🔒-security)
- [Book a call](#📞-book-a-call)

## About crowd.dev
crowd.dev is the Developer Data Platform(DDP) that enables companies to centralize all the touchpoints developers have with their product and brand. These touchpoints can be in the community (e.g., Stack Overflow or Reddit), product (open-source or SaaS), or commercial channels (e.g., HubSpot). The platform retrieves data from various sources, normalizes it, matches identities across platforms, and enriches it with third-party data. The result is a unified 360-degree view of the developers who engage with your product and community, the companies they work for, and their position in their personal customer journey. 

crowd.dev is open-source, built with developers in mind, available for both hosted and self-hosted deployments, open to extensions, and offers full control over your data. 

**To our **users**:**
- You can actively get involved, contribute to our roadmap, and shape crowd.dev into the tool you've always wanted.
- We are open about what we are building, allowing you to take a look inside and ensuring that we handle your data in a privacy-preserving way.
- Our interests as a company are aligned with yours, and we aim to consistently deliver sufficient value to you with our commercial offering in relation to our pricing.

**To our developer community:**
- You can self-host crowd.dev to centralize data for your community or company while maintaining full control over your data.
- Our product is designed for extensibility. If you can think of any use cases that you want to build with the data we collect and store for you, please go ahead and build them! We will be here to help out if you need assistance.
- You can actively contribute to crowd.dev (e.g., integrations), and we will support you along the journey. Just refer to our [Contributing guide](https://github.com/CrowdDotDev/crowd.dev/blob/main/CONTRIBUTING.md) for guidance.

## ✨ Features

- **Plug & play integrations** to connect all relevant platforms, such as GitHub, Discord, Slack, or LinkedIn ([all integrations](https://www.crowd.dev/integrations)).
- **Identity resolution & automated segmentation** to effortlessly understand activities and profiles across platforms.
- **Opinionated analytics & reports** on topics like product-market-fit and open-source community activity to further inform your GTM strategy.
- **Workflows automation** with webhooks.
- **2-way CRM sync & Slack alerts** to recieve real-time notifications about intent events [cloud only].
- **User enrichment** with 25+ attributes, including emails, social profiles, work experience, and technical skills [cloud only].
- **Organization enrichment** with 50+ attributes, including industry, headcount, and revenue [cloud only].
- **Sentiment analysis and conversation detection** to stay informed about what's happening in your open-source community [cloud only].
- **[Eagle Eye](https://www.crowd.dev/eagle-eye)**: Monitor developer-focused community platforms to find relevant content to engage with, helping you to gain developers’ mindshare and grow your community organically [cloud only].


## 🚀 Getting started

### Cloud version

Our <a href="https://app.crowd.dev/">cloud version</a> offers a fast, easy, and free way to begin using crowd.dev.

### Self-hosted version

To get started with self-hosting, take a look at our [self-hosting docs](https://docs.crowd.dev/docs/getting-started-with-self-hosting).

#### Deployment with Kubernetes

Our services can be deployed using Kubernetes, as well as a lightweight development environment using Docker. You can read more about it in our [self-hosting docs](https://docs.crowd.dev/docs/deployment).

#### Integrations

We currently support all our integrations for self-hosting. For each one of them, you will need to create your own application. You can see the steps for each integration in our [self-hosting integrations guide](https://docs.crowd.dev/docs/self-hosting).

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

## 🗺️ Roadmap

You can find more features on our [public roadmap](https://crowd.dev/roadmap). Feel free to also [open an issue](https://crowd.dev/open-an-issue) for anything you're missing.


## 🔔 Stay up-to-date

crowd.dev is still in beta and we ship new features every week. To stay in the loop, leave us a star and subscribe to our <a href="https://crowd.dev/newsletter-sign-up">monthly newsletter</a>. Thanks a lot! ❤️


## ✍️ Contribution

There are various ways you can contribute to crowd.dev! Here are a few options:

- Star this repository.
- Create issues whenever you feel something is missing or goes wrong.
- Upvote issues with a 👍 reaction so we know what's the demand for a particular issue and can prioritize it within the roadmap.

If you'd like to contribute to the development of the project, please refer to our [Contributing guide](https://github.com/CrowdDotDev/crowd.dev/blob/main/CONTRIBUTING.md).

All contributions are highly appreciated. 🙏

## ⚖️ License

Distributed under the Apache 2.0 License. See `LICENSE` for more information.

Our self-hosted version can be run and deployed by default under the permissive Apache 2.0 license. All premium components will be hidden and inactive with the default configuration. You can run, deploy, and contribute to the app without worrying about violating the premium license. Check out the [premium self-hosted features docs](https://docs.crowd.dev/docs/premium-self-hosted-apps) to learn more about the premium self-hosted features.

## Security

We take security very seriously. If you come across any security vulnerabilities, please disclose them by sending an email to security@crowd.dev. We appreciate your help in making our platform as secure as possible and are committed to working with you to resolve any issues quickly and efficiently.

## Book a call

Schedule a call with a crowd.dev team member to learn more about our product and ensure you get the most out of it.

<a href="https://cal.com/team/CrowdDotDev/intro-to-crowd-dev/"><img alt="Book us with Cal.com" src="https://cal.com/book-with-cal-dark.svg" /></a>
