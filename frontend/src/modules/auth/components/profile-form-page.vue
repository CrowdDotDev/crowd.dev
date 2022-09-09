<template>
  <div>
    <h1 class="app-content-title">
      <app-i18n code="auth.profile.title"></app-i18n>
    </h1>
    <div class="panel">
      <el-form
        ref="form"
        :label-position="labelPosition"
        :label-width="labelWidthForm"
        :model="model"
        :rules="rules"
        class="form"
        @submit.prevent="doSubmit"
      >
        <el-form-item
          :label="fields.email.label"
          :prop="fields.email.name"
          :required="fields.email.required"
        >
          <el-col :lg="11" :md="16" :sm="24">
            <el-input
              ref="focus"
              v-model="model[fields.email.name]"
              disabled
            />
          </el-col>
        </el-form-item>
        <el-form-item
          :label="fields.firstName.label"
          :prop="fields.firstName.name"
          :required="fields.firstName.required"
        >
          <el-col :lg="11" :md="16" :sm="24">
            <el-input
              ref="focus"
              v-model="model[fields.firstName.name]"
            />
          </el-col>
        </el-form-item>

        <el-form-item
          :label="fields.lastName.label"
          :prop="fields.lastName.name"
          :required="fields.lastName.required"
        >
          <el-col :lg="11" :md="16" :sm="24">
            <el-input
              v-model="model[fields.lastName.name]"
            />
          </el-col>
        </el-form-item>

        <el-form-item>
          <div class="form-buttons">
            <el-button
              :disabled="saveLoading"
              class="btn btn--primary mr-2"
              @click="doSubmit"
            >
              <i class="ri-lg ri-save-line mr-1" />
              <app-i18n code="common.save"></app-i18n>
            </el-button>

            <el-button
              :disabled="saveLoading"
              class="btn btn--secondary mr-2"
              @click="doReset"
            >
              <i class="ri-lg ri-arrow-go-back-line mr-1" />
              <app-i18n code="common.reset"></app-i18n>
            </el-button>

            <router-link
              :to="{ path: '/' }"
              class="inline-flex"
            >
              <el-button
                :disabled="saveLoading"
                class="btn btn--secondary"
              >
                <i class="ri-lg ri-close-line mr-1" />
                <app-i18n code="common.cancel"></app-i18n>
              </el-button>
            </router-link>
          </div>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script>
import { UserModel } from '@/premium/user/user-model'
import { mapGetters, mapActions } from 'vuex'
import { FormSchema } from '@/shared/form/form-schema'

const { fields } = UserModel

const formSchema = new FormSchema([
  fields.email,
  fields.firstName,
  fields.lastName
])

export default {
  name: 'AppProfileFormPage',

  data() {
    return {
      rules: formSchema.rules(),
      model: null,
      mystorage: {
        id: 'slackHistory',
        folder: 'integrations/slack/:tenantId/',
        maxSizeInBytes: 5000000000,
        bypassWritingPermissions: true,
        publicRead: false
      }
    }
  },

  computed: {
    ...mapGetters({
      labelPosition: 'layout/labelPosition',
      labelWidthForm: 'layout/labelWidthForm',
      currentUser: 'auth/currentUser',
      saveLoading: 'auth/loadingUpdateProfile'
    }),

    fields() {
      return fields
    }
  },

  async created() {
    this.model = formSchema.initialValues(this.currentUser)
  },

  methods: {
    ...mapActions({
      doUpdateProfile: 'auth/doUpdateProfile'
    }),

    doReset() {
      this.model = formSchema.initialValues(
        this.currentUser
      )
    },

    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        return
      }

      const values = formSchema.cast(this.model)
      this.doUpdateProfile(values)
    }
  }
}
</script>
