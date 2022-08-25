<template>
  <div class="relative">
    <h1 class="app-content-title pt-2">
      <app-i18n
        code="entities.report.edit.title"
        v-if="isEditing"
      ></app-i18n>
      <app-i18n
        code="entities.report.new.title"
        v-if="!isEditing"
      ></app-i18n>
    </h1>

    <div
      class="app-page-spinner"
      v-if="loading('form')"
      v-loading="loading('form')"
    ></div>

    <app-report-form
      :isEditing="isEditing"
      :record="record"
      :saveLoading="loading('submit')"
      @cancel="doCancel"
      @submit="doSubmit"
      v-if="!loading('form')"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ReportForm from '@/modules/report/components/report-form.vue'
import { routerAsync } from '@/router'

export default {
  name: 'app-report-form-page',

  props: ['id'],

  components: {
    'app-report-form': ReportForm
  },

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
