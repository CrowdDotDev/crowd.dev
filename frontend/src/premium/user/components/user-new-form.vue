<template>
  <div>
    <el-form
      :label-position="labelPosition"
      :label-width="labelWidthForm"
      :model="model"
      :rules="rules"
      @submit.native.prevent="doSubmit"
      class="form"
      ref="form"
    >
      <div class="flex items-center -mx-2">
        <el-form-item
          :label="fields.emails.label"
          :prop="fields.emails.name"
          :required="fields.emails.required"
          v-if="!single"
          class="w-full lg:w-1/2 mx-2"
        >
          <app-user-invite-autocomplete
            v-model="model[fields.emails.name]"
          />
        </el-form-item>

        <el-form-item
          :label="fields.email.label"
          :prop="fields.email.name"
          :required="fields.email.required"
          v-if="single"
          class="w-full lg:w-1/2 mx-2"
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
          class="w-full lg:w-1/2 mx-2"
        >
          <el-select
            multiple
            placeholder="Select the roles"
            v-model="model[fields.roles.name]"
          >
            <el-option
              :key="option.value"
              :label="option.label"
              :value="option.value"
              v-for="option in fields.roles.options"
            ></el-option>
          </el-select>
        </el-form-item>
      </div>

      <div v-if="invitationToken">
        <div
          class="flex items-center text-green-900 text-sm"
        >
          <i class="ri-lg ri-check-line mr-1"></i>An invite
          has been sent to
          <span class="font-semibold ml-1">{{
            model.email
          }}</span>
        </div>
        <div class="text-gray-600 text-sm mt-6 mb-1">
          Alternatively you could also copy the following
          invite link and send it directly.
        </div>
        <el-form-item class="w-full">
          <el-input
            :value="computedInviteLink"
            :readonly="true"
          >
            <el-tooltip
              content="Copy to Clipboard"
              placement="top"
              slot="append"
            >
              <el-button
                icon="ri-clipboard-line"
                @click="copyToClipboard('token')"
              ></el-button>
            </el-tooltip>
          </el-input>
        </el-form-item>
      </div>

      <div
        class="form-buttons mt-12"
        v-if="!invitationToken"
      >
        <el-button
          :disabled="saveLoading"
          @click="doSubmit"
          icon="ri-lg ri-mail-send-line"
          class="btn btn--primary mr-2"
        >
          Invite
        </el-button>

        <el-button
          :disabled="saveLoading"
          @click="doReset"
          icon="ri-lg ri-arrow-go-back-line"
          class="btn btn--secondary mr-2"
        >
          <app-i18n code="common.reset"></app-i18n>
        </el-button>

        <el-button
          :disabled="saveLoading"
          @click="doCancel"
          icon="ri-lg ri-close-line"
          class="btn btn--secondary"
        >
          <app-i18n code="common.cancel"></app-i18n>
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { FormSchema } from '@/shared/form/form-schema'
import { UserModel } from '@/premium/user/user-model'
import { i18n } from '@/i18n'
import UserInviteAutocomplete from './user-invite-autocomplete'
import Message from '@/shared/message/message'
import config from '@/config'

const { fields } = UserModel
const singleFormSchema = new FormSchema([
  fields.email,
  fields.firstName,
  fields.lastName,
  fields.phoneNumber,
  fields.avatars,
  fields.rolesRequired
])

const multipleFormSchema = new FormSchema([
  fields.emails,
  fields.firstName,
  fields.lastName,
  fields.phoneNumber,
  fields.avatars,
  fields.rolesRequired
])

export default {
  name: 'app-user-new-form',

  props: ['saveLoading', 'single', 'invitationToken'],

  components: {
    'app-user-invite-autocomplete': UserInviteAutocomplete
  },

  data() {
    return {
      rules: this.single
        ? singleFormSchema.rules()
        : multipleFormSchema.rules(),
      model: {}
    }
  },

  computed: {
    ...mapGetters({
      labelPosition: 'layout/labelPosition',
      labelWidthForm: 'layout/labelWidthForm'
    }),

    computedInviteLink() {
      return `${config.frontendUrl.protocol}://${config.frontendUrl.host}/auth/invitation?token=${this.invitationToken}`
    },

    formSchema() {
      return this.single
        ? singleFormSchema
        : multipleFormSchema
    },

    fields() {
      return fields
    }
  },

  async created() {
    this.model = this.formSchema.initialValues()
  },

  methods: {
    doReset() {
      this.model = this.formSchema.initialValues()
      this.$refs.form.resetFields()
    },

    async copyToClipboard() {
      await navigator.clipboard.writeText(
        this.computedInviteLink
      )
      Message.success(
        `Invite link successfully copied to your clipboard`
      )
    },

    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        return
      }

      const values = this.formSchema.cast(this.model)

      if (values.email) {
        values.emails = [values.email]
        delete values.email
      }

      return this.$emit('submit', {
        id: null,
        values
      })
    },

    doCancel() {
      this.$emit('cancel')
    },

    i18n(code) {
      return i18n(code)
    }
  }
}
</script>
