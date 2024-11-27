import LfDrawer from './Drawer.vue';

export default {
  title: 'LinuxFoundation/Drawer',
  component: LfDrawer,
  tags: ['autodocs'],
  argTypes: {
    // Props
    modelValue: {
      description: 'Is drawer open',
      defaultValue: 'false',
      control: 'boolean',
    },

    width: {
      description: 'Specifies drawer width',
      defaultValue: '37.5rem',
      control: 'text',
    },

    closeFunction: {
      description: 'Function that prevents drawer from closing',
      control: {
        type: null,
      },
    },

    // Slots
    default: {
      description: 'Any content belonging to drawer',
      control: {
        type: null,
      },
    },

    // Events
    'update:modelValue': {
      description: 'Event triggered when drawer open state changes',
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
