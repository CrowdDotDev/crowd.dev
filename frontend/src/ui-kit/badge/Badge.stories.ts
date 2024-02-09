import { badgeSize } from '@/ui-kit/badge/types/BadgeSize';
import { badgeType } from '@/ui-kit/badge/types/BadgeType';
import CrBadge from './Badge.vue';

export default {
  title: 'Crowd.dev/Badge',
  component: CrBadge,
  tags: ['autodocs'],
  argTypes: {
    // Props
    size: {
      description: 'Specifies badge size',
      defaultValue: 'medium',
      control: 'select',
      options: badgeSize,
    },
    type: {
      description: 'Specifies badge type',
      defaultValue: 'default',
      control: 'select',
      options: badgeType,
    },

    // Slots
    default: {
      description: 'Text or html content of the radio',
      control: {
        type: null,
      },
    },
  },
};

export const Regular = {
  args: {
    size: 'medium',
    type: 'default',
    default: 'Badge',
  },
};

export const White = {
  args: {
    size: 'medium',
    type: 'white',
    default: 'Badge',
  },
};

export const Brand = {
  args: {
    size: 'medium',
    type: 'brand',
    default: 'Badge',
  },
};
