import LfCard from './Card.vue';

export default {
  title: 'LinuxFoundation/Card',
  component: LfCard,
  tags: ['autodocs'],
  argTypes: {
    // Slots
    default: {
      description: 'Text or html content of the button',
      control: {
        type: null,
      },
    },
  },
};

export const Default = {
  label: 'Primary',
  args: {
    default: 'This is card content',
  },
  parameters: {
    backgrounds: {
      default: 'lf-background',
      values: [
        {
          name: 'lf-background',
          value: '#f8f8f8',
        },
      ],
    },
  },
  render: () => ({
    components: { LfCard },
    template: '<div class="flex"><lf-card class="p-12">This is card content</lf-card></div>',
  }),
};
