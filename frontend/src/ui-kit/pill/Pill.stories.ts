import { pillColor } from '@/ui-kit/pill/types/PillColor';
import { pillType } from '@/ui-kit/pill/types/PillType';
import LfPill from './Pill.vue';

export default {
  title: 'LinuxFoundation/Pill',
  component: LfPill,
  tags: ['autodocs'],
  argTypes: {
    // Props
    color: {
      description: 'Specifies pill color',
      defaultValue: 'green',
      control: 'select',
      options: pillColor,
    },
    type: {
      description: 'Specifies pill type',
      defaultValue: 'default',
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

export const Regular = {
  args: {
    color: 'green',
    type: 'solid',
    default: 'Pill',
  },
};

export const Green = {
  args: {
    color: 'green',
    type: 'solid',
    default: 'Pill',
  },
};

export const Primary = {
  args: {
    color: 'primary',
    type: 'solid',
    default: 'Pill',
  },
};

export const Yellow = {
  args: {
    color: 'yellow',
    type: 'solid',
    default: 'Pill',
  },
};

export const Gray = {
  args: {
    color: 'gray',
    type: 'solid',
    default: 'Pill',
  },
};

export const BorderedTransparent = {
  args: {
    color: 'transparent',
    type: 'bordered',
    default: 'Pill',
  },
};
