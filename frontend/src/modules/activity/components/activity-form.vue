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
      v-if="model"
    >
      <div class="flex items-center -mx-2">
        <el-form-item
          :label="fields.communityMember.label"
          :prop="fields.communityMember.name"
          :required="fields.communityMember.required"
          class="w-full lg:w-1/2 mx-2"
        >
          <app-community-member-autocomplete-input
            :fetchFn="fields.communityMember.fetchFn"
            :mapperFn="fields.communityMember.mapperFn"
            :showCreate="false"
            v-model="model[fields.communityMember.name]"
            :placeholder="
              fields.communityMember.placeholder
            "
            mode="single"
          ></app-community-member-autocomplete-input>

          <div
            v-if="fields.communityMember.hint"
            class="app-form-hint"
          >
            {{ fields.communityMember.hint }}
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
            v-model="model[fields.type.name]"
            :placeholder="fields.type.placeholder"
            ref="focus"
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
            type="datetime"
            v-model="model[fields.timestamp.name]"
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
          @click="doSubmit"
          icon="ri-lg ri-save-line"
          class="btn btn--primary mr-2"
        >
          <app-i18n code="common.save"></app-i18n>
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
import { ActivityModel } from '@/modules/activity/activity-model'
import CustomAttributeInput from '@/shared/form/custom-attribute-input'
import AppPlatformAutocompleteInput from '@/shared/form/platform-autocomplete-input'

const { fields } = ActivityModel
const formSchema = new FormSchema([
  fields.type,
  fields.timestamp,
  fields.platform,
  fields.isKeyAction,
  fields.communityMember
])

export default {
  name: 'app-activity-form',

  props: ['isEditing', 'record', 'saveLoading', 'modal'],

  components: {
    'app-custom-attribute-input': CustomAttributeInput,
    AppPlatformAutocompleteInput
  },

  data() {
    return {
      rules: formSchema.rules(),
      model: null
    }
  },

  created() {
    this.model = formSchema.initialValues(this.record || {})
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
