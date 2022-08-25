<template>
  <div>
    <app-user-new-form
      :saveLoading="saveLoading"
      :invitationToken="invitationToken"
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
  name: 'app-user-new-page',

  components: {
    'app-user-new-form': UserNewForm
  },

  computed: {
    ...mapGetters({
      saveLoading: 'user/form/saveLoading'
    })
  },

  data() {
    return {
      invitationToken: null
    }
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
