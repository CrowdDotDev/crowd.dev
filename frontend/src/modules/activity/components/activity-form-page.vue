<template>
  <div>
    <div
      class="app-page-spinner"
      v-if="initLoading"
      v-loading="initLoading"
    ></div>

    <app-activity-form
      :isEditing="isEditing"
      :record="record"
      :saveLoading="saveLoading"
      @cancel="doCancel"
      @submit="doSubmit"
      v-if="!initLoading"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ActivityForm from '@/modules/activity/components/activity-form.vue'

export default {
  name: 'app-activity-form-page',

  props: ['id'],

  components: {
    'app-activity-form': ActivityForm
  },

  computed: {
    ...mapGetters({
      record: 'activity/form/record',
      initLoading: 'activity/form/initLoading',
      saveLoading: 'activity/form/saveLoading'
    }),

    isEditing() {
      return Boolean(this.id)
    }
  },

  async created() {
    await this.doInit(this.id)
  },

  methods: {
    ...mapActions({
      doInit: 'activity/form/doInit',
      doUpdate: 'activity/form/doUpdate',
      doCreate: 'activity/form/doCreate'
    }),

    doCancel() {
      this.$emit('cancel')
    },

    async doSubmit(payload) {
      if (this.isEditing) {
        await this.doUpdate(payload)
        this.$emit('cancel')
      } else {
        await this.doCreate(payload.values)
        this.$emit('cancel')
      }
    }
  }
}
</script>

<style></style>
