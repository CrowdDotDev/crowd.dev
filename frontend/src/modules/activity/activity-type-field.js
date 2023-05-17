import JSONField from '@/shared/fields/json-field';
import { toSentenceCase } from '@/utils/string';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { storeToRefs } from 'pinia';
import { useActivityTypeStore } from '@/modules/activity/store/type';

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
    return Object.entries(activityTypes).map(([key, value]) => {
      let platformName = CrowdIntegrations.getConfig(key)?.name;

      if (!platformName) {
        platformName = key === 'other' ? 'Custom' : key;
      }

      return {
        label: {
          type: 'platform',
          key,
          value: platformName,
        },
        nestedOptions: Object.entries(value).map(([activityKey, activityValue]) => ({
          value: activityKey,
          label: toSentenceCase(activityValue.display.short),
        })),
      };
    });
  }

  dropdownOptions() {
    const activityTypeStore = useActivityTypeStore();
    const { types } = storeToRefs(activityTypeStore);

    const {
      default: defaultActivityTypes,
      custom: customActivityTypes,
    } = types.value;

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
      defaultValue: [],
      value: [],
      defaultOperator: null,
      operator: null,
      type: 'select-group',
      include: true,
    };
  }
}
