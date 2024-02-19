import CrField from '@/ui-kit/field/Field.vue';
import CrInput from '@/ui-kit/input/Input.vue';
import { reactive } from 'vue';
import { email, required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import CrFieldMessages from './FieldMessages.vue';

export default {
  title: 'Crowd.dev/FieldMessages',
  component: CrFieldMessages,
  tags: ['autodocs'],
  argTypes: {
    // Props
    validation: {
      description: 'Enter vuelidate validation',
      control: {
        type: null,
      },
    },
    errorMessages: {
      description: 'Specifies custom error messages',
      control: {
        type: 'object',
      },
    },

    // Slots
    icon: {
      description: 'Message icon',
      control: {
        type: null,
      },
    },
  },
};

export const Regular = {
  args: {
    errorMessages: { required: 'This field is required', email: 'Invalid email' },
  },
  render: (args: any) => ({
    components: { CrField, CrInput, CrFieldMessages },
    setup() {
      const form = reactive({
        email: '',
      });

      const rules = {
        email: {
          required,
          email,
        },
      };

      const v = useVuelidate(rules, form);

      return { args, form, v };
    },
    template: `<cr-field
        label-text="Email"
        :required="true"
    >
      <cr-input
          v-model="form.email"
          placeholder="Email address"
          :invalid="v.email.$invalid && v.email.$dirty"
          @blur="v.email.$touch()"
      />
      <cr-field-messages
          :validation="v.email"
          :error-messages="args.errorMessages"
      />
    </cr-field>`,
  }),
};
