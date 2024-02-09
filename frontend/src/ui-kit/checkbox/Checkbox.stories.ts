import { checkboxSizes } from '@/ui-kit/checkbox/types/CheckboxSize';
import CrCheckbox from './Checkbox.vue';

export default {
  title: 'Crowd.dev/Checkbox',
  component: CrCheckbox,
  tags: ['autodocs'],
  argTypes: {
    // Props
    size: {
      description: 'Specifies checkbox size',
      defaultValue: 'medium',
      control: 'select',
      options: checkboxSizes,
    },
    modelValue: {
      description: 'Checkbox value',
      control: {
        type: null,
      },
    },
    value: {
      description: 'Value for checkbox when checked',
      control: {
        type: null,
      },
    },
    disabled: {
      description: 'Specifies if checkbox is disabled',
      defaultValue: false,
      control: 'boolean',
    },
    multiple: {
      description: 'Specifies if checkbox is disabled',
      defaultValue: false,
      control: 'boolean',
    },

    // Slots
    default: {
      description: 'Text or html content of the checkbox',
      control: {
        type: null,
      },
    },

    // Events
    'update:modelValue': {
      description: 'Event triggered when value changes',
      control: {
        type: null,
      },
    },
  },
};

export const Primary = {
  label: 'Primary',
  args: {
    size: 'medium',
    modelValue: false,
    disabled: false,
    multiple: false,
    default: 'Checkbox text',
  },
};

export const Checked = {
  label: 'Primary',
  args: {
    size: 'medium',
    modelValue: true,
    disabled: false,
    multiple: false,
    default: 'Checkbox text',
  },
};

export const Disabled = {
  label: 'Primary',
  args: {
    size: 'medium',
    modelValue: true,
    disabled: true,
    multiple: false,
    default: 'Checkbox text',
  },
};

export const Multiple = {
  label: 'Primary',
  args: {
    size: 'medium',
    modelValue: true,
    disabled: false,
    multiple: true,
    default: 'Checkbox text',
  },
};
