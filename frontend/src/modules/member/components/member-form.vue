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
          :prop="'displayName'"
          :required="fields.displayName.required"
          class="w-full lg:w-1/2 mx-2"
        >
          <template #error="scope">
            <span class="el-form-item__error">
              {{ scope.error.split('displayName')[1] }}
            </span>
          </template>
          <el-input
            ref="focus"
            v-model="model.displayName"
            :placeholder="fields.placeholder"
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
        <app-member-platform-input v-model="platforms" />
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
import { MemberModel } from '@/modules/member/member-model'
import CustomAttributeInput from '@/shared/form/custom-attribute-input'
import AppMemberPlatformInput from '@/modules/member/components/member-platform-input'

const { fields } = MemberModel
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
  name: 'AppMemberForm',

  components: {
    'app-custom-attribute-input': CustomAttributeInput,
    AppMemberPlatformInput
  },

  props: {
    isEditing: {
      type: Boolean,
      default: false
    },
    saveLoading: {
      type: Boolean,
      default: false
    },
    record: {
      type: Object,
      default: () => {}
    }
  },
  emits: ['cancel', 'submit'],

  data() {
    return {
      rules: formSchema.rules(),
      model: null,
      platforms: []
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
            displayName: this.model.displayName
              ? this.model.displayName
              : undefined
          }
        )
      },
      deep: true
    }
  },

  created() {
    this.model = formSchema.initialValues(this.record || {})

    this.model.displayName = {
      displayName: this.record
        ? this.record.displayName
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
