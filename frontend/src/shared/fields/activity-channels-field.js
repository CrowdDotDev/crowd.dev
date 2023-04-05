import JSONField from '@/shared/fields/json-field';
import { store } from '@/store';
import { CrowdIntegrations } from '@/integrations/integrations-config';

export default class ActivityChannelsField extends JSONField {
  constructor(name, label, config = {}) {
    super(name, label);

    this.placeholder = config.placeholder;
    this.hint = config.hint;
    this.required = config.required;
    this.matches = config.matches;
    this.filterable = config.filterable || false;
    this.custom = config.custom || false;
    this.fromMembers = config.fromMembers || false;
  }

  dropdownOptions() {
    const activityChannels = store.getters['auth/currentTenant'].settings[0].activityChannels || {};

    const extractRepoNameFromUrl = (url) => {
      const regex = /^https?:\/\/github\.com\/(.+?)\/(.+?)(?:\.git)?$/;
      const match = url.match(regex);
      if (match) {
        return match[2];
      }
      return url;
    };

    return Object.entries(activityChannels).map(([key, value]) => ({
      label: {
        type: 'platform',
        key,
        value: CrowdIntegrations.getConfig(key).name,
      },
      nestedOptions: value.map((v) => ({
        value: v,
        label: extractRepoNameFromUrl(v),
      })),
    }));
  }

  forFilter() {
    return {
      name: this.name,
      label: this.label,
      custom: this.custom,
      props: {
        options: this.dropdownOptions(),
        multiple: false,
      },
      defaultValue: null,
      value: null,
      defaultOperator: null,
      operator: null,
      type: 'select-group',
      include: true,
    };
  }
}
