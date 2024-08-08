import LfLoading from './Loading.vue';

export default {
  title: 'LinuxFoundation/Loading',
  component: LfLoading,
  tags: ['autodocs'],
  argTypes: {
    // Propr
    height: {
      description: 'Loader height',
      defaultValue: '100px',
      control: 'text',
    },
    width: {
      description: 'Loader width',
      defaultValue: '100%',
      control: 'text',
    },
    count: {
      description: 'Number of loaders',
      defaultValue: '1',
      control: 'number',
    },
  },
};

export const Default = {
  label: 'Primary',
  args: {
    height: '100px',
    width: '100%',
    count: 1,
  },
};
