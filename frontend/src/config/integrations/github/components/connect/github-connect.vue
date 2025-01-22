<template>
  <div>
    <div class="flex items-center gap-4">
      <!--      <lf-button type="secondary-ghost" class="!text-gray-500" @click="isDetailsModalOpen = true">-->
      <!--        <lf-icon name="circle-info" type="regular" />-->
      <!--        Details-->
      <!--      </lf-button>-->
      <lf-button type="secondary" @click="isConnectModalOpen = true">
        <lf-icon name="link-simple" />
        Connect
      </lf-button>
    </div>
    <lf-github-connect-modal
      v-if="isConnectModalOpen"
      v-model="isConnectModalOpen"
    />
    <!--    <lf-github-details-modal-->
    <!--      v-if="isDetailsModalOpen"-->
    <!--      v-model="isDetailsModalOpen"-->
    <!--      @connect="isConnectModalOpen = true; isDetailsModalOpen = false;"-->
    <!--    />-->
    <lf-github-connect-finishing-modal v-model="isFinishingModalOpen" />
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { useRoute } from 'vue-router';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import LfGithubConnectFinishingModal
  from '@/config/integrations/github/components/connect/github-connect-finishing-modal.vue';
// import LfGithubDetailsModal from '@/config/integrations/github/components/github-details-modal.vue';
import LfGithubConnectModal from './github-connect-modal.vue';

const route = useRoute();
const { doGithubConnect } = mapActions('integration');

const isConnectModalOpen = ref(false);
// const isDetailsModalOpen = ref(false);
const isFinishingModalOpen = ref(false);

const finallizeGithubConnect = () => {
  const {
    code, source, state,
  } = route.query;
  const setupAction = route.query.setup_action;
  const installId = route.query.installation_id;

  if (code && !source && state !== 'noconnect') {
    isFinishingModalOpen.value = true;
    doGithubConnect({
      code,
      installId,
      setupAction,
    }).then(() => {
      isFinishingModalOpen.value = false;
    });
  }
};

onMounted(() => {
  finallizeGithubConnect();
});
</script>

<script lang="ts">
export default {
  name: 'LfGithubConnect',
};
</script>
