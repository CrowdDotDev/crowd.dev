<template>
  <div>
    <div
      v-if="initLoading"
      v-loading="initLoading"
      class="app-page-spinner"
    ></div>

    <app-activity-form
      v-if="!initLoading"
      :is-editing="isEditing"
      :record="record"
      :save-loading="saveLoading"
      @cancel="doCancel"
      @submit="doSubmit"
    />
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import ActivityForm from '@/modules/activity/components/activity-form.vue'

export default {
  name: 'AppActivityFormPage',

  components: {
    'app-activity-form': ActivityForm
  },

  props: {
    id: {
      type: String,
      default: null
    }
  },
  emits: ['cancel'],

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
