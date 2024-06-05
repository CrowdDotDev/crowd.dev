import LfAvatar from './Avatar.vue';

export default {
  title: 'LinuxFoundation/Avatar',
  component: LfAvatar,
  tags: ['autodocs'],
  argTypes: {
    // Props
    size: {
      description: 'Specifies avatar size',
      defaultValue: 32,
      control: 'number',
    },
    name: {
      description: 'Name which translates to initials which are shown if no avatar',
      defaultValue: '',
      control: 'text',
    },
    src: {
      description: 'Avatar image url',
      defaultValue: '',
      control: 'text',
    },
  },
};

export const Default = {
  args: {
    size: 96,
    name: 'John Doe',
    src: 'https://media.istockphoto.com/id/1318482009/photo/young-woman-ready-for-job-business-concept.jpg?s=612x612&w=0&k=20&c=Jc1NcoUMoM78AxPTh9EApaPU2kXh2evb499JgW99b0g=',
    id: 1,
  },
};
export const NoImage = {
  args: {
    size: 96,
    name: 'John Doe',
    src: '',
    id: 0,
  },
};
