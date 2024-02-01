import CrCard from './Card.vue';

export default {
  title: 'Crowd.dev/Card',
  component: CrCard,
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
      default: 'crowd-background',
      values: [
        {
          name: 'crowd-background',
          value: '#f8f8f8',
        },
      ],
    },
  },
  render: () => ({
    components: { CrCard },
    template: '<div class="flex"><cr-card class="p-12">This is card content</cr-card></div>',
  }),
};
