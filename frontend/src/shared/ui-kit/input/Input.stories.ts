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
  },
};

export const Disabled = {
  label: 'Required',
  args: {
    placeholder: 'Placeholder',
    modelValue: '',
    disabled: true,
  },
};

export const Invalid = {
  label: 'Required',
  args: {
    placeholder: 'Placeholder',
    modelValue: 'Invalid value',
    invalid: true,
  },
};

export const Prefix = {
  label: 'Required',
  args: {
    placeholder: 'Your name',
    modelValue: 'John Doe',
    prefix: 'prefix',
  },
};

export const Suffix = {
  label: 'Required',
  args: {
    placeholder: 'Your name',
    modelValue: 'John Doe',
    suffix: 'suffix',
  },
};
