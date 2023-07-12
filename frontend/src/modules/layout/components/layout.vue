<template>
  <el-container v-if="currentTenant">
    <!-- App menu -->
    <app-lf-menu />

    <el-container :style="elMainStyle">
      <el-main id="main-page-wrapper" class="relative">
        <app-lf-banners />
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script>
import { mapGetters } from 'vuex';
import identify from '@/shared/monitoring/identify';
import AppLfMenu from '@/modules/lf/layout/components/lf-menu.vue';
import AppLfBanners from '@/modules/lf/layout/components/lf-banners.vue';

export default {
  name: 'AppLayout',

  components: {
    AppLfMenu,
    AppLfBanners,
  },

  computed: {
    ...mapGetters({
      currentUser: 'auth/currentUser',
      currentTenant: 'auth/currentTenant',
    }),
  },

  async mounted() {
    identify(this.currentUser);
    this.initPendo();
  },

  methods: {
    initPendo() {
      // This function creates anonymous visitor IDs in Pendo unless you change the visitor id field to use your app's values
      // This function uses the placeholder 'ACCOUNT-UNIQUE-ID' value for account ID unless you change the account id field to use your app's values
      // Call this function in your authentication promise handler or callback when your visitor and account id values are available
      // Please use Strings, Numbers, or Bools for value types.
      window.pendo.initialize({
        visitor: {
          id: this.currentUser.id, // Required if user is logged in, default creates anonymous ID
          email: this.currentUser.email, // Recommended if using Pendo Feedback, or NPS Email
          full_name: this.currentUser.fullName, // Recommended if using Pendo Feedback
          // role:         // Optional

          // You can add any additional visitor level key-values here,
          // as long as it's not one of the above reserved names.
        },

        account: {
          id: this.currentTenant?.id, // Required if using Pendo Feedback, default uses the value 'ACCOUNT-UNIQUE-ID'
          name: this.currentTenant?.name, // Optional
          is_paying: this.currentTenant?.plan !== 'Essential', // Recommended if using Pendo Feedback
          // monthly_value:// Recommended if using Pendo Feedback
          // planLevel:    // Optional
          // planPrice:    // Optional
          // creationDate: // Optional

          // You can add any additional account level key-values here,
          // as long as it's not one of the above reserved names.
        },
      });
    },
  },
};
</script>
