import JSONField from '@/shared/fields/json-field';
import { store } from '@/store';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { computed } from 'vue';
import { extractRepoNameFromUrl } from '@/utils/string';
import { useActivityStore } from '@/modules/activity/store/pinia';
import { storeToRefs } from 'pinia';

export default class ActivityChannelsField extends JSONField {
  constructor(name, label, config = {}) {
    super(name, label);

    this.filterable = config.filterable || false;
    this.custom = config.custom || false;
  }

  dropdownOptions() {
    const activityStore = useActivityStore();
    const { activityChannels } = storeToRefs(activityStore);

    return Object.entries(activityChannels.value).map(([platform, channels]) => ({
      label: {
        type: 'platform',
        key: platform,
        value: CrowdIntegrations.getConfig(platform).name,
      },
      nestedOptions: channels.map((channel) => ({
        value: channel,
        label: platform === 'github' ? extractRepoNameFromUrl(channel) : channel,
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
        searchable: true,
        searchPlaceholder: 'Search for channels',
        searchEmpty: 'No channels found',
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
