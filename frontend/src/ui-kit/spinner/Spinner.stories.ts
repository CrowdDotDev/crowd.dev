import LfSpinner from './Spinner.vue';

export default {
  title: 'LinuxFoundation/Spinner',
  component: LfSpinner,
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
