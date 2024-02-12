import CrField from './Field.vue';
import CrInput from '../input/Input.vue';

export default {
  title: 'Crowd.dev/Field',
  component: CrField,
  tags: ['autodocs'],
  argTypes: {
    // Props
    labelText: {
      description: 'Specifies label text',
      defaultValue: 'Label',
      control: 'text',
    },
    required: {
      description: 'Specifies if field is required',
      defaultValue: false,
      control: 'boolean',
    },
    for: {
      description: 'for attribute to link with input',
      control: {
        type: null,
      },
    },

    // Slots
    default: {
      description: 'Text or html content of the field',
      control: {
        type: null,
      },
    },
    label: {
      description: 'Label content if needs to be custom',
      control: {
        type: null,
      },
    },
    action: {
      description: 'Action content on right side of field',
      control: {
        type: null,
      },
    },
  },
};

export const Primary = {
  label: 'Required',
  args: {
    labelText: 'Label',
    required: true,
    for: '',
    default: '',
  },
  render: (args: any) => ({
    components: { CrField, CrInput },
    setup() {
      return { args };
    },
    template: `<cr-field :label-text="args.labelText" :required="args.required">
      <cr-input model-value="" placeholder="placeholder"></cr-input>
    </cr-field>`,
  }),
};
