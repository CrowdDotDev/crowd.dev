import JSONField from '@/shared/fields/json-field';
import { capitalizeFirstLetter } from '@/utils/string';
import { store } from '@/store';
import { computed } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

export default class ActivityTypeField extends JSONField {
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

  getActivityTypes(activityTypes) {
    return Object.entries(activityTypes).map(([key, value]) => ({
      label: {
        type: 'platform',
        key,
        value: CrowdIntegrations.getConfig(key).name,
      },
      nestedOptions: Object.entries(value).map(([activityKey, activityValue]) => ({
        value: activityKey,
        label: capitalizeFirstLetter(activityValue.display.short),
      })),
    }));
  }

  dropdownOptions() {
    const currentTenant = computed(
      () => store.getters['auth/currentTenant'],
    );

    const {
      default: defaultActivityTypes,
      custom: customActivityTypes,
    } = currentTenant.value.settings[0].activityTypes;

    const defaultOptions = this.getActivityTypes(defaultActivityTypes);
    const customOptions = this.getActivityTypes(customActivityTypes);

    return [...defaultOptions, ...customOptions];
  }

  forFilter() {
    if (this.fromMembers) {
      return {
        name: this.name,
        label: this.label,
        custom: this.custom,
        props: {
          options: this.dropdownOptions(),
          multiple: false,
        },
        defaultValue: (this.value || []).map((item) => item.value),
        value: (this.value || []).map((item) => item.value),
        defaultOperator: 'overlap',
        operator: 'overlap',
        type: 'select-group',
        include: true,
      };
    }
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
