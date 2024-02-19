import { radioSizes } from '@/ui-kit/radio/types/RadioSize';
import { reactive } from 'vue';
import CrRadio from './Radio.vue';

export default {
  title: 'Crowd.dev/Radio',
  component: CrRadio,
  tags: ['autodocs'],
  argTypes: {
    // Props
    size: {
      description: 'Specifies radio size',
      defaultValue: 'medium',
      control: 'select',
      options: radioSizes,
    },
    modelValue: {
      description: 'Radio value',
      control: {
        type: null,
      },
    },
    value: {
      description: 'Value for radio when selected',
      control: {
        type: null,
      },
    },
    disabled: {
      description: 'Specifies if radio is disabled',
      defaultValue: false,
      control: 'boolean',
    },

    // Slots
    default: {
      description: 'Text or html content of the radio',
      control: {
        type: null,
      },
    },

    // Events
    'update:modelValue': {
      description: 'Event triggered when value changes',
      control: {
        type: null,
      },
    },
  },
};

export const Regular = {
  label: 'Primary',
  args: {
    size: 'medium',
    disabled: false,
    default: 'Radio text',
    modelValue: true,
  },
};

export const Multiple = {
  label: 'Primary',
  args: {
    size: 'medium',
    disabled: false,
    default: 'Primary',
    modelValue: true,
  },
  render: (args: any) => ({
    components: { CrRadio },
    setup() {
      const form = reactive({
        type: 'primary',
      });

      return { args, form };
    },
    template: `<div>
      <cr-radio v-model="form.type" value="primary" class="mb-2" :size="args.size" :disabled="args.disabled">
        Primary<p>This is primary description</p>
      </cr-radio>
      <cr-radio v-model="form.type" value="secondary" class="mb-2" :size="args.size" :disabled="args.disabled">
        Secondary<p>This is secondary description</p>
      </cr-radio>
      <cr-radio v-model="form.type" value="tertiary" :size="args.size" :disabled="args.disabled">
        Tertiary<p>This is tertiary description</p>
      </cr-radio>
    </div>`,
  }),
};

export const Disabled = {
  label: 'Primary',
  args: {
    size: 'medium',
    disabled: true,
    default: 'Disabled radio',
  },
};
