<template>
  <div>
    <el-dialog
      :title="title"
      :visible.sync="dialogVisible"
      width="80%"
    >
      <app-activity-form
        :modal="true"
        :record="record"
        :saveLoading="saveLoading"
        @cancel="doCancel"
        @submit="doSubmit"
      />
    </el-dialog>
  </div>
</template>

<script>
import ActivityForm from '@/modules/activity/components/activity-form.vue'
import { ActivityService } from '@/modules/activity/activity-service'
import { i18n } from '@/i18n'
import Errors from '@/shared/error/errors'

export default {
  name: 'app-activity-form-modal',

  props: ['visible'],

  components: {
    'app-activity-form': ActivityForm
  },

  data() {
    return {
      record: null,
      saveLoading: false
    }
  },

  computed: {
    dialogVisible: {
      get: function () {
        return this.visible
      },

      set: function (value) {
        if (!value) {
          this.$emit('close')
        }
      }
    },

    title() {
      return i18n('entities.activity.new.title')
    }
  },

  methods: {
    async doSubmit(payload) {
      try {
        this.saveLoading = true
        const { id } = await ActivityService.create(
          payload.values
        )
        const record = await ActivityService.find(id)
        this.$emit('success', record)
      } catch (error) {
        Errors.handle(error)
      } finally {
        this.saveLoading = false
      }
    },

    doCancel() {
      this.dialogVisible = false
    }
  }
}
</script>

<style></style>
