import JSONField from '@/shared/fields/json-field';
import en from '@/i18n/en';
import activityTypesJson from '@/jsons/activity-types.json';

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

  dropdownOptions() {
    return [
      {
        label: {
          type: 'platform',
          key: 'github',
          value: 'GitHub',
        },
        nestedOptions: activityTypesJson.github.map(
          (activity) => ({
            value: activity,
            label: en.entities.activity.github[activity],
          }),
        ),
      },
      {
        label: {
          type: 'platform',
          key: 'twitter',
          value: 'Twitter',
        },
        nestedOptions: activityTypesJson.twitter.map(
          (activity) => ({
            value: activity,
            label: en.entities.activity.twitter[activity],
          }),
        ),
      },
      {
        label: {
          type: 'platform',
          key: 'discord',
          value: 'Discord',
        },
        nestedOptions: activityTypesJson.discord
          .map((activity) => ({
            value: activity,
            label: en.entities.activity.discord[activity],
          }))
          .filter(
            (option) => !['replied_thread', 'replied'].includes(
              option.value,
            ),
          ),
      },
      {
        label: {
          type: 'platform',
          key: 'slack',
          value: 'Slack',
        },
        nestedOptions: activityTypesJson.slack.map(
          (activity) => ({
            value: activity,
            label: en.entities.activity.slack[activity],
          }),
        ),
      },
      {
        label: {
          type: 'platform',
          key: 'hackernews',
          value: 'Hacker News',
        },
        nestedOptions: activityTypesJson.hackernews.map(
          (activity) => ({
            value: activity,
            label: en.entities.activity.hackernews[activity],
          }),
        ),
      },
      {
        label: {
          type: 'platform',
          key: 'devto',
          value: 'DEV',
        },
        nestedOptions: activityTypesJson.devto.map(
          (activity) => ({
            value: activity,
            label: en.entities.activity.devto[activity],
          }),
        ),
      },
      {
        label: {
          type: 'platform',
          key: 'reddit',
          value: 'Reddit',
        },
        nestedOptions: activityTypesJson.reddit.map(
          (activity) => ({
            value: activity,
            label: en.entities.activity.reddit[activity],
          }),
        ),
      },
      {
        label: {
          type: 'platform',
          key: 'linkedin',
          value: 'LinkedIn',
        },
        nestedOptions: activityTypesJson.linkedin.map(
          (activity) => ({
            value: activity,
            label: en.entities.activity.linkedin[activity],
          }),
        ),
      },
      {
        label: {
          type: 'platform',
          key: 'stackoverflow',
          value: 'Stack Overflow',
        },
        nestedOptions: activityTypesJson.stackoverflow.map(
          (activity) => ({
            value: activity,
            label:
              en.entities.activity.stackoverflow[activity],
          }),
        ),
      },
    ];
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
        defaultValue: null,
        value: (this.value || []).map((item) => item.value),
        defaultOperator: 'overlap',
        operator: 'overlap',
        type: 'select-group',
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
    };
  }
}
