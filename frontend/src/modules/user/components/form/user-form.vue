<template>
  <div>
    <el-form
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
          :required="fields.email.required"
          class="col-span-2"
        >
          <el-input
            ref="focus"
            v-model="model[fields.email.name]"
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

      <div v-if="invitationToken" class="p-6">
        <div
          class="flex items-center text-green-600 text-sm"
        >
          <i class="ri-lg ri-check-line mr-1" />An invite
          has been sent to
          <span class="font-semibold ml-1">{{
            model.email
          }}</span>
        </div>
        <div class="text-gray-600 text-sm mt-6 mb-1">
          Alternatively you could also copy the following
          invite link and send it directly.
        </div>
        <el-form-item>
          <el-input
            class="copy-input"
            :value="computedInviteLink"
            :readonly="true"
          >
            <template #append>
              <el-tooltip
                content="Copy to Clipboard"
                placement="top"
              >
                <el-button
                  class="append-icon"
                  @click="copyToClipboard('token')"
                >
                  <i class="ri-clipboard-line" />
                </el-button>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>
      </div>
    </el-form>
    <el-footer
      v-if="!invitationToken"
      class="el-dialog__footer"
      :class="
        hasFormChanged ? 'justify-between' : 'justify-end'
      "
    >
      <el-button
        v-if="hasFormChanged"
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
          @click="doCancel"
        >
          <app-i18n code="common.cancel" />
        </el-button>

        <el-button
          :disabled="saveLoading || !hasFormChanged"
          class="btn btn--md btn--primary"
          @click="doSubmit"
        >
          Send invite
        </el-button>
      </div>
    </el-footer>
  </div>
</template>

<script>
import isEqual from 'lodash/isEqual';
import { FormSchema } from '@/shared/form/form-schema';
import { UserModel } from '@/modules/user/user-model';
import { i18n } from '@/i18n';
import Message from '@/shared/message/message';
import config from '@/config';
import { onSelectMouseLeave } from '@/utils/select';

const { fields } = UserModel;
const formSchema = new FormSchema([
  fields.email,
  fields.rolesRequired,
]);

export default {
  name: 'AppUserNewForm',

  props: {
    saveLoading: {
      type: Boolean,
      default: false,
    },
    invitationToken: {
      type: String,
      default: null,
    },
  },
  emits: ['submit', 'cancel'],

  data() {
    return {
      rules: formSchema.rules(),
      model: formSchema.initialValues({}),
    };
  },

  computed: {
    computedInviteLink() {
      return `${config.frontendUrl.protocol}://${config.frontendUrl.host}/auth/invitation?token=${this.invitationToken}`;
    },

    fields() {
      return fields;
    },
    hasFormChanged() {
      return !isEqual(
        this.model,
        formSchema.initialValues({}),
      );
    },
  },

  methods: {
    doReset() {
      this.model = formSchema.initialValues();
      this.$refs.form.resetFields();
    },

    async copyToClipboard() {
      await navigator.clipboard.writeText(
        this.computedInviteLink,
      );
      Message.success(
        'Invite link successfully copied to your clipboard',
      );
    },

    async doSubmit() {
      try {
        await this.$refs.form.validate();
      } catch (error) {
        return;
      }

      const values = formSchema.cast(this.model);

      if (values.email) {
        values.emails = [values.email];
        delete values.email;
      }

      this.$emit('submit', {
        id: null,
        values,
      });
    },

    doCancel() {
      this.$emit('cancel');
    },

    i18n(code) {
      return i18n(code);
    },

    onSelectMouseLeave,
  },
};
</script>
