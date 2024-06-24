import LfButton from '@/ui-kit/button/Button.vue';
import LfContenteditable from './Contenteditable.vue';

export default {
  components: { LfButton },
  title: 'LinuxFoundation/Contenteditable',
  component: LfContenteditable,
  tags: ['autodocs'],
  argTypes: {
    // Props
    modelValue: {
      description: 'Content of contenteditable',
      control: 'text',
    },

    // Events
    'update:modelValue': {
      description: 'Event triggered when content is updated',
      control: {
        type: null,
      },
    },
  },
};

export const Regular = {
  args: {
    modelValue: 'This content is editable',
  },
};
