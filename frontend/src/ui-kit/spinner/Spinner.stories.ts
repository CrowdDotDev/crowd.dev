import CrSpinner from './Spinner.vue';

export default {
  title: 'Crowd.dev/Spinner',
  component: CrSpinner,
  tags: ['autodocs'],
  argTypes: {
    // Props
    size: {
      description: 'Specifies spinner size',
      defaultValue: '2.5rem',
      control: 'text',
    },
  },
};

export const Regular = {
  args: {
    size: '2.5rem',
  },
};
