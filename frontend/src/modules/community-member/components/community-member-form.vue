<template>
  <div>
    <el-form
      v-if="model"
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
          label="Display Name"
          :prop="'username.crowdUsername'"
          :required="fields.username.required"
          class="w-full lg:w-1/2 mx-2"
        >
          <template #error="scope">
            <span class="el-form-item__error">
              {{
                scope.error.split(
                  'username.crowdUsername'
                )[1]
              }}
            </span>
          </template>
          <el-input
            ref="focus"
            v-model="model.username.crowdUsername"
            :placeholder="fields.username.placeholder"
          />
          <div
            v-if="fields.username.hint"
            class="app-form-hint"
          >
            {{ fields.username.hint }}
          </div>
        </el-form-item>
        <el-form-item
          :label="fields.email.label"
          :prop="fields.email.name"
          :required="fields.email.required"
          class="w-full lg:w-1/2 mx-2"
        >
          <el-input
            v-model="model[fields.email.name]"
            :placeholder="fields.email.placeholder"
          />

          <div
            v-if="fields.email.hint"
            class="app-form-hint"
          >
            {{ fields.email.hint }}
          </div>
        </el-form-item>
      </div>

      <el-form-item label="Usernames & Profiles *">
        <app-community-member-platform-input
          v-model="platforms"
        />
      </el-form-item>

      <div class="flex items-center -mx-2">
        <el-form-item
          :label="fields.joinedAt.label"
          :prop="fields.joinedAt.name"
          :required="fields.joinedAt.required"
          class="w-full lg:w-1/2 mx-2"
        >
          <el-date-picker
            v-model="model[fields.joinedAt.name]"
            type="date"
            placeholder="Pick a date"
          >
          </el-date-picker>
        </el-form-item>

        <el-form-item
          :label="fields.organisation.label"
          class="w-full lg:w-1/2 mx-2"
        >
          <el-input
            v-model="model[fields.organisation.name]"
          />
        </el-form-item>
      </div>

      <el-form-item :label="fields.location.label">
        <el-input v-model="model[fields.location.name]" />
      </el-form-item>
      <el-form-item :label="fields.bio.label">
        <el-input
          v-model="model[fields.bio.name]"
          type="textarea"
        />
      </el-form-item>

      <el-form-item
        :label="fields.info.label"
        :prop="fields.info.name"
      >
        <app-custom-attribute-input
          v-model="model[fields.info.name]"
        />
      </el-form-item>

      <el-form-item
        :label="fields.tags.label"
        :prop="fields.tags.name"
        :required="fields.tags.required"
      >
        <app-tag-autocomplete-input
          v-model="model[fields.tags.name]"
          :fetch-fn="fields.tags.fetchFn"
          :mapper-fn="fields.tags.mapperFn"
          :create-if-not-found="true"
          :placeholder="fields.tags.placeholder"
        ></app-tag-autocomplete-input>

        <div v-if="fields.tags.hint" class="app-form-hint">
          {{ fields.tags.hint }}
        </div>
      </el-form-item>

      <div class="form-buttons mt-8">
        <el-button
          :disabled="saveLoading"
          icon="ri-lg ri-save-line"
          class="btn btn--primary mr-2"
          @click="doSubmit"
        >
          <app-i18n code="common.save"></app-i18n>
        </el-button>

        <el-button
          :disabled="saveLoading"
          icon="ri-lg ri-arrow-go-back-line"
          class="btn btn--secondary mr-2"
          @click="doReset"
        >
          <app-i18n code="common.reset"></app-i18n>
        </el-button>

        <el-button
          :disabled="saveLoading"
          icon="ri-lg ri-close-line"
          class="btn btn--secondary"
          @click="doCancel"
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
import { CommunityMemberModel } from '@/modules/community-member/community-member-model'
import CustomAttributeInput from '@/shared/form/custom-attribute-input'
import AppCommunityMemberPlatformInput from '@/modules/community-member/components/community-member-platform-input'

const { fields } = CommunityMemberModel
const formSchema = new FormSchema([
  fields.username,
  fields.tags,
  fields.bio,
  fields.location,
  fields.organisation,
  fields.joinedAt,
  fields.email
])

export default {
  name: 'AppCommunityMemberForm',

  components: {
    'app-custom-attribute-input': CustomAttributeInput,
    AppCommunityMemberPlatformInput
  },

  props: ['isEditing', 'record', 'saveLoading', 'modal'],

  data() {
    return {
      rules: formSchema.rules(),
      model: null,
      platforms: []
    }
  },

  watch: {
    platforms: {
      handler(newValue) {
        this.model.crowdInfo = newValue.reduce(
          (acc, platform) => {
            if (
              platform.name &&
              platform.username &&
              platform.url
            ) {
              acc[platform.name] = {
                ...this.model.crowdInfo[platform.name],
                url: platform.url
              }
            }
            return acc
          },
          {}
        )
        this.model.username = newValue.reduce(
          (acc, platform) => {
            if (platform.name && platform.username) {
              acc[platform.name] = platform.username
            }
            return acc
          },
          {
            crowdUsername: this.model.username.crowdUsername
              ? this.model.username.crowdUsername
              : undefined
          }
        )
      },
      deep: true
    }
  },

  created() {
    this.model = formSchema.initialValues(this.record || {})

    this.model.username = {
      crowdUsername: this.record
        ? this.record.username.crowdUsername
        : null
    }

    this.model.info = this.record ? this.record.info : {}
    this.model.crowdInfo = this.record
      ? this.record.crowdInfo
      : {}

    if (this.record && this.record.crowdInfo) {
      this.platforms = Object.keys(this.record.crowdInfo)
        .filter((i) => i !== 'apis')
        .map((key) => {
          return {
            name: key,
            url: this.record.crowdInfo[key].url,
            username: this.record.username[key]
          }
        })
    } else {
      this.platforms = [
        {
          name: null,
          username: null,
          url: null
        }
      ]
    }
  },

  computed: {
    ...mapGetters({
      labelPosition: 'layout/labelPosition',
      labelWidthForm: 'layout/labelWidthForm'
    }),

    fields() {
      return fields
    }
  },

  methods: {
    doReset() {
      this.model = formSchema.initialValues(this.record)
    },

    doCancel() {
      this.$emit('cancel')
    },

    async doSubmit() {
      try {
        await this.$refs.form.validate()
      } catch (error) {
        console.log(error)
        return
      }

      return this.$emit('submit', {
        id: this.record && this.record.id,
        values: formSchema.cast(this.model)
      })
    }
  }
}
</script>

<style></style>
