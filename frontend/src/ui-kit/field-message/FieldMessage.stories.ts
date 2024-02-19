import { fieldMessageTypes } from '@/ui-kit/field-message/types/FieldMessageType';
import CrFieldMessage from './FieldMessage.vue';
import CrInput from '../input/Input.vue';
import CrField from '../field/Field.vue';

export default {
  title: 'Crowd.dev/FieldMessage',
  component: CrFieldMessage,
  tags: ['autodocs'],
  argTypes: {
    // Props
    type: {
      description: 'Specifies field message type',
      defaultValue: 'error',
      control: 'select',
      options: fieldMessageTypes,
    },
    hideIcon: {
      description: 'Specifies if message icon is hidden',
      defaultValue: false,
      control: 'boolean',
    },

    // Slots
    default: {
      description: 'Message',
      control: {
        type: null,
      },
    },
    icon: {
      description: 'Icon content',
      control: {
        type: null,
      },
    },
  },
};

const render = (args: any) => ({
  components: { CrField, CrInput, CrFieldMessage },
  setup() {
    return { args };
  },
  template: `<cr-field label-text="Field">
      <cr-input model-value="" placeholder="placeholder" :invalid="args.type === 'error'" />
      <cr-field-message :type="args.type" :hide-icon="args.hideIcon">{{args.default}}</cr-field-message>
    </cr-field>`,
});

export const Error = {
  args: {
    type: 'error',
    hideIcon: false,
    default: 'This is error message',
  },
  render,
};

export const Warning = {
  args: {
    type: 'warning',
    hideIcon: false,
    default: 'This is warning',
  },
  render,
};

export const Info = {
  args: {
    type: 'info',
    hideIcon: false,
    default: 'This is info message',
  },
  render,
};

export const Hint = {
  args: {
    type: 'hint',
    hideIcon: false,
    default: 'This is hint for stupid people',
  },
  render,
};
