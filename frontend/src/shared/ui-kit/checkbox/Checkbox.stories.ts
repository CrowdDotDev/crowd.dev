import CrCheckbox from './Checkbox.vue';
import { checkboxSizes } from '@/shared/ui-kit/checkbox/types/CheckboxSize';

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

    // Slots
    default: {
      description: 'Text or html content of the checkbox',
      control: {
        type: null,
      },
    },
  },
};

export const Primary = {
  label: 'Primary',
  args: {
    size: 'default',
  },
};
