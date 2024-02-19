import { switchSizes } from '@/ui-kit/switch/types/SwitchSize';
import CrSwitch from './Switch.vue';

export default {
  title: 'Crowd.dev/Switch',
  component: CrSwitch,
  tags: ['autodocs'],
  argTypes: {
    // Props
    size: {
      description: 'Specifies switch size',
      defaultValue: 'medium',
      control: 'select',
      options: switchSizes,
    },
    modelValue: {
      description: 'Switch value',
      control: {
        type: null,
      },
    },
    value: {
      description: 'Value for switch when enabled',
      control: {
        type: null,
      },
    },
    disabled: {
      description: 'Specifies if switch is disabled',
      defaultValue: false,
      control: 'boolean',
    },

    // Slots
    default: {
      description: 'Text or html content of the switch',
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
  label: 'Primary',
  args: {
    size: 'medium',
    disabled: false,
    default: 'Switch text',
  },
};
export const Disabled = {
  label: 'Primary',
  args: {
    size: 'medium',
    disabled: true,
    modelValue: true,
    default: 'Disabled',
  },
};
