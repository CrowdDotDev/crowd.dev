<template>
  <div>
    <div
      v-if="initLoading"
      v-loading="initLoading"
      class="app-page-spinner"
    ></div>

    <app-member-form
      v-if="!initLoading"
      :is-editing="isEditing"
      :record="record"
      :save-loading="saveLoading"
      @cancel="doCancel"
      @submit="doSubmit"
    />
  </div>
</template>

<!-- TODO: Update getters and methods according to new store structure -->
<script>
import { mapGetters, mapActions } from 'vuex'
import MemberForm from '@/modules/member/components/member-form.vue'

export default {
  name: 'AppMemberFormPage',

  components: {
    'app-member-form': MemberForm
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
      record: 'member/form/record',
      initLoading: 'member/form/initLoading',
      saveLoading: 'member/form/saveLoading'
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
      doInit: 'member/form/doInit',
      doUpdate: 'member/form/doUpdate',
      doCreate: 'member/form/doCreate'
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
