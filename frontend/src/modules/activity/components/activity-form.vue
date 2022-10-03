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
          :label="fields.member.label"
          :prop="fields.member.name"
          :required="fields.member.required"
          class="w-full lg:w-1/2 mx-2"
        >
          <app-member-autocomplete-input
            v-model="model[fields.member.name]"
            :fetch-fn="fields.member.fetchFn"
            :mapper-fn="fields.member.mapperFn"
            :show-create="false"
            :placeholder="fields.member.placeholder"
            mode="single"
          ></app-member-autocomplete-input>

          <div
            v-if="fields.member.hint"
            class="app-form-hint"
          >
            {{ fields.member.hint }}
          </div>
        </el-form-item>
        <el-form-item
          :label="fields.platform.label"
          :prop="fields.platform.name"
          :required="fields.platform.required"
          class="w-full lg:w-1/2 mx-2"
        >
          <app-platform-autocomplete-input
            v-model="model[fields.platform.name]"
            :placeholder="fields.platform.placeholder"
          />

          <div
            v-if="fields.platform.hint"
            class="app-form-hint"
          >
            {{ fields.platform.hint }}
          </div>
        </el-form-item>
      </div>
      <div class="flex items-center -mx-2">
        <el-form-item
          :label="fields.type.label"
          :prop="fields.type.name"
          :required="fields.type.required"
          class="w-full lg:w-1/2 mx-2"
        >
          <el-input
            ref="focus"
            v-model="model[fields.type.name]"
            :placeholder="fields.type.placeholder"
          />

          <div
            v-if="fields.type.hint"
            class="app-form-hint"
          >
            {{ fields.type.hint }}
          </div>
        </el-form-item>

        <el-form-item
          :label="fields.timestamp.label"
          :prop="fields.timestamp.name"
          :required="fields.timestamp.required"
          class="w-full lg:w-1/2 mx-2"
        >
          <el-date-picker
            v-model="model[fields.timestamp.name]"
            type="datetime"
            :placeholder="fields.timestamp.placeholder"
          ></el-date-picker>

          <div
            v-if="fields.timestamp.hint"
            class="app-form-hint"
          >
            {{ fields.timestamp.hint }}
          </div>
        </el-form-item>
      </div>

      <el-form-item
        :label="fields.isKeyAction.label"
        :prop="fields.isKeyAction.name"
        class="w-full lg:w-1/2"
      >
        <el-switch
          v-model="model[fields.isKeyAction.name]"
          active-text="Yes"
          inactive-text="No"
        >
        </el-switch>
        <div
          v-if="fields.isKeyAction.hint"
          class="app-form-hint"
        >
          {{ fields.isKeyAction.hint }}
        </div>
      </el-form-item>

      <el-form-item
        :label="fields.info.label"
        :prop="fields.info.name"
      >
        <app-custom-attribute-input
          v-model="model[fields.info.name]"
        />
      </el-form-item>

      <div class="form-buttons mt-12">
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
          <i class="ri-lg ri-close-line" />
          <app-i18n code="common.cancel"></app-i18n>
        </el-button>
      </div>
    </el-form>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { FormSchema } from '@/shared/form/form-schema'
import { ActivityModel } from '@/modules/activity/activity-model'
import CustomAttributeInput from '@/shared/form/custom-attribute-input'
import AppPlatformAutocompleteInput from '@/shared/form/platform-autocomplete-input'

const { fields } = ActivityModel
const formSchema = new FormSchema([
  fields.type,
  fields.timestamp,
  fields.platform,
  fields.isKeyAction,
  fields.member
])

export default {
  name: 'AppActivityForm',

  components: {
    'app-custom-attribute-input': CustomAttributeInput,
    AppPlatformAutocompleteInput
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
      model: null
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

  created() {
    this.model = formSchema.initialValues(this.record || {})
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
