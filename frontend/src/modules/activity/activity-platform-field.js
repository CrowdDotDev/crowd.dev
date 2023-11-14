import StringField from '@/shared/fields/string-field';
import appConfig from '@/config';

export default class ActivityPlatformField extends StringField {
  constructor(name, label, config = {}) {
    super(name, label);

    this.placeholder = config.placeholder;
    this.hint = config.hint;
    this.required = config.required;
    this.matches = config.matches;
    this.filterable = config.filterable || false;
    this.custom = config.custom || false;
  }

  dropdownOptions() {
    const options = [
      {
        value: 'github',
        label: 'GitHub',
      },
      {
        value: 'discord',
        label: 'Discord',
      },
      {
        value: 'slack',
        label: 'Slack',
      },
      {
        value: 'twitter',
        label: 'X/Twitter',
      },
      {
        value: 'devto',
        label: 'DEV',
      },
      {
        value: 'hackernews',
        label: 'Hacker News',
      },
      {
        value: 'reddit',
        label: 'Reddit',
      },
      {
        value: 'linkedin',
        label: 'LinkedIn',
      },
      {
        value: 'other',
        label: 'Other',
      },
      {
        value: 'stackoverflow',
        label: 'Stack Overflow',
      },
      {
        value: 'discourse',
        label: 'Discourse',
      },
    ];

    if (appConfig.isGitIntegrationEnabled) {
      return [
        ...options,
        {
          value: 'git',
          label: 'Git',
        },
      ];
    }

    return options;
  }

  forFilter() {
    return {
      name: this.name,
      label: this.label,
      custom: this.custom,
      props: {
        options: this.dropdownOptions(),
        multiple: true,
      },
      defaultValue: [],
      value: [],
      defaultOperator: null,
      operator: null,
      type: 'select-multi',
    };
  }
}
