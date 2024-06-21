import LfButton from '@/ui-kit/button/Button.vue';
import LfModal from './Modal.vue';

export default {
  components: { LfButton },
  title: 'LinuxFoundation/Modal',
  component: LfModal,
  tags: ['autodocs'],
  argTypes: {
    // Props
    modelValue: {
      description: 'Is modal open',
      defaultValue: 'false',
      control: 'boolean',
    },

    width: {
      description: 'Specifies modal width',
      defaultValue: '37.5rem',
      control: 'text',
    },

    closeFunction: {
      description: 'Function that prevents modal from closing',
      control: {
        type: null,
      },
    },

    // Slots
    default: {
      description: 'Any content belonging to modal',
      control: {
        type: null,
      },
    },

    // Events
    'update:modelValue': {
      description: 'Event triggered when modal open state changes',
      control: {
        type: null,
      },
    },
  },
};

export const Regular = {
  args: {
  },
};
