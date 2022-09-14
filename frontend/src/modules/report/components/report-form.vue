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
      <el-form-item class="absolute top-0 right-0 mt-1">
        <div class="form-buttons">
          <el-button
            :disabled="saveLoading"
            class="btn btn--primary ml-2"
            @click="doSubmit"
          >
            <i class="ri-lg ri-save-line mr-1" />
            <app-i18n code="common.save"></app-i18n>
          </el-button>

          <el-button
            :disabled="saveLoading"
            class="btn btn--secondary ml-2"
            @click="doReset"
          >
            <i class="ri-lg ri-save-line mr-1" />
            <app-i18n code="common.reset"></app-i18n>
          </el-button>

          <el-button
            :disabled="saveLoading"
            class="btn btn--secondary ml-2"
            @click="doCancel"
          >
            <i class="ri-lg ri-close-line mr-1"></i>
            <app-i18n code="common.cancel"></app-i18n>
          </el-button>
        </div>
      </el-form-item>
      <div class="flex items-center -mx-4">
        <el-form-item
          :label="fields.name.label"
          :prop="fields.name.name"
          :required="fields.name.required"
          class="w-full lg:w-1/3 mx-4"
        >
          <el-input
            ref="focus"
            v-model="model[fields.name.name]"
            :placeholder="fields.name.placeholder"
          />

          <div
            v-if="fields.name.hint"
            class="app-form-hint"
          >
            {{ fields.name.hint }}
          </div>
        </el-form-item>

        <el-form-item
          :label="fields.public.label"
          :prop="fields.public.name"
          :required="fields.public.required"
          class="w-full lg:w-1/3 mx-4"
        >
          <div class="flex items-center">
            <el-switch
              v-model="model[fields.public.name]"
              active-text="Yes"
              inactive-text="No"
            >
            </el-switch>
            <el-tooltip
              content="Can be seen by anyone who has the shareable link"
              placement="top"
            >
              <i
                class="flex items-center text-lg ri-question-line ml-4 text-gray-400"
              ></i>
            </el-tooltip>
          </div>
          <div
            v-if="fields.public.hint"
            class="app-form-hint"
          >
            {{ fields.public.hint }}
          </div>
        </el-form-item>
      </div>

      <el-form-item label="Widgets">
        <ReportGridLayout
          v-model="model"
          :editable="true"
          class="-mx-4 -mt-4"
        />
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { mapGetters } from 'vuex'
import { FormSchema } from '@/shared/form/form-schema'
import { ReportModel } from '@/modules/report/report-model'
import { WidgetService } from '@/modules/widget/widget-service'
import ReportGridLayout from './report-grid-layout'

const { fields } = ReportModel
const formSchema = new FormSchema([
  fields.name,
  fields.widgets,
  fields.settings,
  fields.public
])

export default {
  name: 'AppReportForm',

  components: {
    ReportGridLayout
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
    this.model = this.record
      ? JSON.parse(JSON.stringify(this.record))
      : { widgets: [] }
  },

  methods: {
    doReset() {
      this.model = this.record
        ? JSON.parse(JSON.stringify(this.record))
        : { widgets: [] }
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

      for (const widget of this.model.widgets) {
        await WidgetService.update(widget.id, {
          ...widget,
          report: this.model.id ? this.model.id : undefined
        })
      }

      return this.$emit('submit', {
        id: this.record && this.record.id,
        values: formSchema.cast(this.model)
      })
    }
  }
}
</script>

<style lang="scss">
.el-form-item.flex.items-center {
  .el-form-item__content {
    margin-left: 0 !important;
  }
}
</style>
