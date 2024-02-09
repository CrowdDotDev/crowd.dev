import CrInput from './Input.vue';

export default {
  title: 'Crowd.dev/Input',
  component: CrInput,
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      description: 'Input value',
      defaultValue: undefined,
      control: 'text',
    },
    placeholder: {
      description: 'Input placeholder',
      defaultValue: undefined,
      control: 'text',
    },
    disabled: {
      description: 'Specifies if input is disabled',
      defaultValue: false,
      control: 'boolean',
    },
    invalid: {
      description: 'Specifies if input is invalid',
      defaultValue: false,
      control: 'boolean',
    },

    // Slots
    prefix: {
      description: 'Input prefix',
      control: {
        type: null,
      },
    },
    suffix: {
      description: 'Input suffix',
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

export const Regular = {
  label: 'Required',
  args: {
    placeholder: 'Placeholder',
    modelValue: '',
    disabled: false,
    invalid: false,
    type: 'text',
  },
};

export const Disabled = {
  label: 'Required',
  args: {
    placeholder: 'Placeholder',
    modelValue: '',
    disabled: true,
    invalid: false,
    type: 'text',
  },
};

export const Invalid = {
  label: 'Required',
  args: {
    placeholder: 'Placeholder',
    modelValue: 'Invalid value',
    disabled: false,
    invalid: true,
    type: 'text',
  },
};

export const Prefix = {
  label: 'Required',
  args: {
    placeholder: 'Your name',
    modelValue: 'John Doe',
    prefix: 'prefix',
    disabled: false,
    invalid: false,
    type: 'text',
  },
};

export const Suffix = {
  label: 'Required',
  args: {
    placeholder: 'Your name',
    modelValue: 'John Doe',
    suffix: 'suffix',
    disabled: false,
    invalid: false,
    type: 'text',
  },
};
