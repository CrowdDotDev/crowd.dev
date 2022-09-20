<template>
  <div>
    <app-user-new-form
      :save-loading="saveLoading"
      :invitation-token="invitationToken"
      :single="true"
      @cancel="doCancel"
      @submit="doSubmit"
    ></app-user-new-form>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import UserNewForm from '@/premium/user/components/user-new-form.vue'

export default {
  name: 'AppUserNewPage',

  components: {
    'app-user-new-form': UserNewForm
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
