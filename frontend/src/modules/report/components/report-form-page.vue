<template>
  <div class="relative">
    <h1 class="app-content-title pt-2">
      <app-i18n
        v-if="isEditing"
        code="entities.report.edit.title"
      ></app-i18n>
      <app-i18n
        v-if="!isEditing"
        code="entities.report.new.title"
      ></app-i18n>
    </h1>

    <div
      v-if="loading('form')"
      v-loading="loading('form')"
      class="app-page-spinner"
    ></div>

    <app-report-form
      v-if="!loading('form')"
      :is-editing="isEditing"
      :record="record"
      :save-loading="loading('submit')"
      @cancel="doCancel"
      @submit="doSubmit"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ReportForm from '@/modules/report/components/report-form.vue'
import { routerAsync } from '@/router'

export default {
  name: 'AppReportFormPage',

  components: {
    'app-report-form': ReportForm
  },

  props: ['id'],

  computed: {
    ...mapGetters({
      record: 'report/form',
      loading: 'report/loading'
    }),

    isEditing() {
      return Boolean(this.id)
    }
  },

  async created() {
    await this.doInitForm(this.id)
  },

  methods: {
    ...mapActions({
      doInitForm: 'report/doInitForm',
      doUpdate: 'report/doUpdate',
      doCreate: 'report/doCreate'
    }),

    doCancel() {
      routerAsync().push('/reports')
    },

    async doSubmit(payload) {
      if (this.isEditing) {
        return this.doUpdate(payload)
      } else {
        return this.doCreate(payload.values)
      }
    }
  }
}
</script>

<style></style>
