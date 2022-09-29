<template>
  <div>
    <div
      v-if="initLoading"
      v-loading="initLoading"
      class="app-page-spinner"
    ></div>

    <app-community-member-form
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
import CommunityMemberForm from '@/modules/community-member/components/community-member-form.vue'

export default {
  name: 'AppCommunityMemberFormPage',

  components: {
    'app-community-member-form': CommunityMemberForm
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
      record: 'communityMember/form/record',
      initLoading: 'communityMember/form/initLoading',
      saveLoading: 'communityMember/form/saveLoading'
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
      doInit: 'communityMember/form/doInit',
      doUpdate: 'communityMember/form/doUpdate',
      doCreate: 'communityMember/form/doCreate'
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
