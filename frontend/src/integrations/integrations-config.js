import github from './github';
import discord from './discord';
import slack from './slack';
import twitter from './twitter';
import devto from './devto';
import hackernews from './hackernews';
import discourse from './discourse';
// import hubspot from './hubspot';
import stackoverflow from './stackoverflow';
import reddit from './reddit';
import linkedin from './linkedin';
import zapier from './zapier';
import crunchbase from './crunchbase';
// import make from './make';
import git from './git';
import facebook from './facebook';
import n8n from './n8n';
import lfx from './lfx';
import groupsio from './groupsio';
import confluence from './confluence';
import gerrit from './gerrit';
import jira from './jira';
import cvent from './cvent';
import tnc from './tnc';
import gitlab from './gitlab';

class IntegrationsConfig {
  get integrations() {
    return {
      github,
      discord,
      hackernews,
      linkedin,
      twitter,
      // hubspot,
      slack,
      devto,
      reddit,
      stackoverflow,
      discourse,
      zapier,
      n8n,
      git,
      crunchbase,
      groupsio,
      // make,
      facebook,
      confluence,
      gerrit,
      jira,
      gitlab,
    };
  }

  getConfig(platform) {
    if (this.integrations[platform]) {
      return this.integrations[platform];
    }
    return this.customIntegrations[platform];
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

  getPlatformsLabel(platforms) {
    return platforms
      .filter((platform) => !['integration_or_enrichment', 'email', 'integration', 'unknown', 'delete'].includes(platform))
      .map((platform) => {
        if (['enrichment', 'peopledatalabs'].includes(platform)) {
          return '<span class="ri-sparkling-line mr-0.5"></span> Enrichment';
        }
        if (platform === 'custom') {
          return 'Manually added';
        }
        return this.getConfig(platform)?.name || platform;
      }).join(', ');
  }

  get customIntegrations() {
    return {
      cvent,
      lfx,
      lfid: lfx,
      tnc,
      training_cert: tnc,
    };
  }

  get memberIdentities() {
    return {
      github,
      discord,
      hackernews,
      linkedin,
      twitter,
      // hubspot,
      slack,
      devto,
      reddit,
      stackoverflow,
      discourse,
      git,
      groupsio,
      // make,
      confluence,
      gerrit,
      jira,
      cvent,
      lfx,
      tnc,
      gitlab,
    };
  }

  get organizationIdentities() {
    return {
      github,
      linkedin,
      twitter,
      crunchbase,
    };
  }
}

export const CrowdIntegrations = new IntegrationsConfig();
