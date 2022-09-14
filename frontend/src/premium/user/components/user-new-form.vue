<template>
  <div>
    <el-form
      ref="form"
      :label-position="labelPosition"
      :label-width="labelWidthForm"
      :model="model"
      :rules="rules"
      class="form"
      @submit.prevent="doSubmit"
    >
      <div class="flex items-center -mx-2">
        <el-form-item
          v-if="!single"
          :label="fields.emails.label"
          :prop="fields.emails.name"
          :required="fields.emails.required"
          class="w-full lg:w-1/2 mx-2"
        >
          <app-user-invite-autocomplete
            v-model="model[fields.emails.name]"
          />
        </el-form-item>

        <el-form-item
          v-if="single"
          :label="fields.email.label"
          :prop="fields.email.name"
          :required="fields.email.required"
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
            v-model="model[fields.roles.name]"
            multiple
            placeholder="Select the roles"
          >
            <el-option
              v-for="option in fields.roles.options"
              :key="option.value"
              :label="option.label"
              :value="option.value"
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
            >
              <el-button @click="copyToClipboard('token')"
                ><i class="ri-clipboard-line"></i
              ></el-button>
            </el-tooltip>
          </el-input>
        </el-form-item>
      </div>

      <div
        v-if="!invitationToken"
        class="form-buttons mt-12"
      >
        <el-button
          :disabled="saveLoading"
          class="btn btn--primary mr-2"
          @click="doSubmit"
        >
          <i class="ri-lg ri-mail-send-line mr-1" />
          Invite
        </el-button>

        <el-button
          :disabled="saveLoading"
          class="btn btn--secondary mr-2"
          @click="doReset"
        >
          <i class="ri-lg ri-arrow-go-back-line mr-1" />
          <app-i18n code="common.reset"></app-i18n>
        </el-button>

        <el-button
          :disabled="saveLoading"
          class="btn btn--secondary"
          @click="doCancel"
        >
          <i class="ri-lg ri-close-line mr-1" />
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
  name: 'AppUserNewForm',

  components: {
    'app-user-invite-autocomplete': UserInviteAutocomplete
  },

  props: {
    saveLoading: {
      type: Boolean,
      default: false
    },
    single: {
      type: Boolean,
      default: true
    },
    invitationToken: {
      type: String,
      default: null
    }
  },
  emits: ['submit', 'cancel'],

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
