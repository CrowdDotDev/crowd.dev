<template>
  <app-user-form
    :save-loading="saveLoading"
    :invitation-token="invitationToken"
    @cancel="doCancel"
    @submit="doSubmit"
  ></app-user-form>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import AppUserForm from '@/modules/user/components/form/user-form.vue'

export default {
  name: 'AppUserNewPage',

  components: {
    'app-user-form': AppUserForm
  },
  emits: ['cancel'],

  data() {
    return {
      invitationToken: null
    }
  },

  computed: {
    ...mapGetters({
      saveLoading: 'user/form/saveLoading'
    })
  },

  async created() {
    await this.doInit()
  },

  methods: {
    ...mapActions({
      doInit: 'user/form/doInit',
      doAdd: 'user/form/doAdd'
    }),

    doCancel() {
      this.$emit('cancel')
    },

    async doSubmit(payload) {
      try {
        const response = await this.doAdd(payload.values)
        this.invitationToken = response[0].token
      } catch (error) {
        console.log(error)
      }
    }
  }
}
</script>
