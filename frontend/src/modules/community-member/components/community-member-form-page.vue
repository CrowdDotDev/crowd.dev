<template>
  <div>
    <div
      class="app-page-spinner"
      v-if="initLoading"
      v-loading="initLoading"
    ></div>

    <app-community-member-form
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
import CommunityMemberForm from '@/modules/community-member/components/community-member-form.vue'

export default {
  name: 'app-community-member-form-page',

  props: ['id'],

  components: {
    'app-community-member-form': CommunityMemberForm
  },

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
