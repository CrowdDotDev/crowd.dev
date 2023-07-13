<template>
  <div class="p-6 flex justify-center">
    <main class="pt-14">
      <div class="panel !p-0">
        <header class="p-8">
          <div class="pb-12">
            <img
              alt="Crowd logo mini"
              src="/images/logo/crowd-mini.svg"
              class="w-10"
            />
          </div>
          <h3
            class="text-2xl font-semibold leading-12 mb-1"
          >
            Howdie<span v-if="currentUser">, {{ currentUser.firstName }}</span>
          </h3>
          <p class="text-sm text-gray-600 leading-5">
            Let’s setup your community
          </p>
        </header>
        <!-- FORM -->
        <div class="p-8">
          <app-onboard-community :is-new="isNew" />
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import { mapActions, mapGetters } from 'vuex';
import AppOnboardCommunity from '@/modules/onboard/components/onboard-community.vue';

export default {
  name: 'OnboardPage',
  components: {
    AppOnboardCommunity,
  },
  data() {
    return {
      isNew: false,
    };
  },
  computed: {
    ...mapGetters('auth', ['currentUser']),
  },
  created() {
    const { action } = this.$route.query;
    this.isNew = action === 'new';
    if (this.isNew) {
      localStorage.removeItem('onboardType');
      this.clearTenant();
    }
  },
  methods: {
    ...mapActions('auth', ['clearTenant']),
  },
};
</script>
<style lang="scss" scoped>
main {
  width: 100%;
  max-width: 42.75rem;
}

header {
  background: linear-gradient(
    259.13deg,
    #DBEBFE 0%,
    #F6FAFF 100%
  );
}
</style>
