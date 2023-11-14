<template>
  <app-user-form
    :save-loading="saveLoading"
    :invitation-token="invitationToken"
    @cancel="doCancel"
    @submit="doSubmit"
  />
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import AppUserForm from '@/modules/user/components/form/user-form.vue';
import { mapActions as piniaMapActions } from 'pinia';
import { useQuickStartStore } from '@/modules/quickstart/store';

export default {
  name: 'AppUserNewPage',

  components: {
    'app-user-form': AppUserForm,
  },
  emits: ['cancel'],

  data() {
    return {
      invitationToken: null,
    };
  },

  computed: {
    ...mapGetters({
      saveLoading: 'user/form/saveLoading',
    }),
  },

  async created() {
    await this.doInit();
  },

  methods: {
    ...mapActions({
      doInit: 'user/form/doInit',
      doAdd: 'user/form/doAdd',
    }),
    ...piniaMapActions(useQuickStartStore, {
      getGuides: 'getGuides',
    }),

    doCancel() {
      this.$emit('cancel');
    },

    async doSubmit(payload) {
      try {
        const response = await this.doAdd(payload.values);
        this.invitationToken = response[0].token;
        this.getGuides();
      } catch (error) {
        console.error(error);
      }
    },
  },
};
</script>
