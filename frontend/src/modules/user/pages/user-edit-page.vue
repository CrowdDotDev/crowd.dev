<template>
  <div>
    <div
      v-if="initLoading"
      v-loading="initLoading"
      class="app-page-spinner"
    />

    <el-form
      v-if="model"
      ref="form"
      label-position="top"
      :model="model"
      :rules="rules"
      class="form"
      @submit.prevent="doSubmit"
    >
      <div class="grid grid-cols-3 gap-4 px-6 pb-4">
        <el-form-item
          :label="fields.email.label"
          :prop="fields.email.name"
          class="col-span-2"
        >
          <el-input
            v-model="model[fields.email.name]"
            disabled
          />
        </el-form-item>

        <el-form-item
          :label="fields.roles.label"
          :prop="fields.roles.name"
          :required="fields.roles.required"
        >
          <el-select
            v-model="model[fields.roles.name][0]"
            placeholder="Select a role"
          >
            <el-option
              v-for="option in fields.roles.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
              @mouseleave="onSelectMouseLeave"
            />
          </el-select>
        </el-form-item>
      </div>

      <el-footer
        class="el-dialog__footer"
        :class="
          hasFormChanged ? 'justify-between' : 'justify-end'
        "
      >
        <el-button
          v-if="hasFormChanged"
          :disabled="saveLoading"
          class="btn btn-link btn-link--primary"
          @click="doReset"
        >
          <i class="ri-arrow-go-back-line" />
          <span>Reset changes</span>
        </el-button>

        <div class="flex gap-4">
          <el-button
            :disabled="saveLoading"
            class="btn btn--md btn--secondary"
            @click="$emit('cancel')"
          >
            <app-i18n code="common.cancel" />
          </el-button>

          <el-button
            :disabled="saveLoading"
            class="btn btn--md btn--primary"
            @click="doSubmit"
          >
            Update invite
          </el-button>
        </div>
      </el-footer>
    </el-form>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import isEqual from 'lodash/isEqual';
import { FormSchema } from '@/shared/form/form-schema';
import { UserModel } from '@/modules/user/user-model';
import { i18n } from '@/i18n';
import { onSelectMouseLeave } from '@/utils/select';

const { fields } = UserModel;
const formSchema = new FormSchema([
  fields.email,
  fields.roles,
]);

export default {
  name: 'AppUserEditPage',

  props: {
    id: {
      type: String,
      default: null,
    },
  },
  emits: ['cancel'],

  data() {
    return {
      rules: formSchema.rules(),
      model: formSchema.initialValues(this.record),
    };
  },

  computed: {
    ...mapGetters({
      record: 'user/form/record',
      initLoading: 'user/form/initLoading',
      saveLoading: 'user/form/saveLoading',
    }),

    hasFormChanged() {
      return !isEqual(
        this.model,
        formSchema.initialValues(this.record),
      );
    },

    fields() {
      return fields;
    },
  },

  async created() {
    await this.doInit(this.id);
    this.model = formSchema.initialValues(this.record);
  },

  methods: {
    ...mapActions({
      doInit: 'user/form/doInit',
      doUpdate: 'user/form/doUpdate',
    }),

    doReset() {
      this.model = formSchema.initialValues(this.record);
    },

    async doSubmit() {
      try {
        await this.$refs.form.validate();
      } catch (error) {
        return;
      }

      const values = formSchema.cast(this.model);
      delete values.email;
      await this.doUpdate({
        id: this.record && this.record.id,
        ...values,
      });
      this.$emit('cancel');
    },

    i18n(code) {
      return i18n(code);
    },

    onSelectMouseLeave,
  },
};
</script>
