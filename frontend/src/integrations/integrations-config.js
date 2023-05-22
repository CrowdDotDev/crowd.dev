import github from './github';
import discord from './discord';
import slack from './slack';
import twitter from './twitter';
import devto from './devto';
import hackernews from './hackernews';
// import discourse from './discourse'
import stackoverflow from './stackoverflow';
import reddit from './reddit';
import linkedin from './linkedin';
import zapier from './zapier';
import crunchbase from './crunchbase';
import make from './make';
import git from './git';
import facebook from './facebook';

class IntegrationsConfig {
  get integrations() {
    return {
      github,
      discord,
      slack,
      twitter,
      devto,
      hackernews,
      reddit,
      linkedin,
      stackoverflow,
      zapier,
      git,
      crunchbase,
      make,
      facebook,
    };
  }

  getConfig(platform) {
    return this.integrations[platform];
  }

  get configs() {
    return Object.entries(this.integrations).map(
      ([key, config]) => ({
        ...config,
        platform: key,
      }),
    );
  }

  get enabledConfigs() {
    return this.configs.filter((config) => config.enabled);
  }

  mapper(integration, store) {
    return {
      ...integration,
      ...store.getters['integration/findByPlatform'](
        integration.platform,
      ),
    };
  }

  getMappedConfig(platform, store) {
    return this.mapper(
      {
        ...this.getConfig(platform),
        platform,
      },
      store,
    );
  }

  mappedConfigs(store) {
    return this.configs
      .map((i) => this.mapper(i, store))
      .filter((i) => !i.hideAsIntegration);
  }

  mappedEnabledConfigs(store) {
    return this.enabledConfigs
      .map((i) => this.mapper(i, store))
      .filter((i) => !i.hideAsIntegration);
  }
}

export const CrowdIntegrations = new IntegrationsConfig();
