import CrInputPassword from './InputPassword.vue';

export default {
  title: 'Crowd.dev/InputPassword',
  component: CrInputPassword,
  tags: ['autodocs'],
  argTypes: {
    modelValue: {
      description: 'Input value',
      defaultValue: undefined,
      control: 'text',
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
  args: {
    modelValue: 'Very secure password',
  },
};

export const Disabled = {
  args: {
    placeholder: 'Your password',
    modelValue: 'Very secure password',
    disabled: true,
  },
};

export const Invalid = {
  args: {
    placeholder: 'Your password',
    modelValue: 'Very secure password',
    invalid: true,
  },
};
