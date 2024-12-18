import { pillType } from '@/ui-kit/pill/types/PillType';
import LfPill from './Pill.vue';

export default {
  title: 'LinuxFoundation/Pill',
  component: LfPill,
  tags: ['autodocs'],
  argTypes: {
    // Props
    type: {
      description: 'Specifies pill type',
      defaultValue: 'primary',
      control: 'select',
      options: pillType,
    },

    // Slots
    default: {
      description: 'Text or html content of the badge',
      control: {
        type: null,
      },
    },
  },
};

export const Primary = {
  args: {
    type: 'primary',
    default: 'Pill',
  },
};

export const Secondary = {
  args: {
    type: 'secondary',
    default: 'Pill',
  },
};

export const Tertiary = {
  args: {
    type: 'tertiary',
    default: 'Pill',
  },
};

export const Success = {
  args: {
    type: 'success',
    default: 'Pill',
  },
};

export const Warning = {
  args: {
    type: 'warning',
    default: 'Pill',
  },
};

export const Transparent = {
  args: {
    type: 'transparent',
    default: 'Pill',
  },
};
