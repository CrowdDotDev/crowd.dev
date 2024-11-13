<template>
  <div class="flex items-center gap-4">
    <!--      <lf-button type="secondary-ghost" @click="isDetailsModalOpen = true">-->
    <!--        <lf-icon name="circle-info" type="regular" />-->
    <!--        Details-->
    <!--      </lf-button>-->
    <lf-button type="secondary" @click="connect()">
      <lf-icon name="link-simple" />
      Connect
    </lf-button>
  </div>
</template>

<script setup>
import Nango from '@nangohq/frontend';
import { useThrottleFn } from '@vueuse/core';
import config from '@/config';
import { AuthService } from '@/modules/auth/services/auth.service';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import { mapActions } from '@/shared/vuex/vuex.helpers';

const { doLinkedinConnect } = mapActions('integration');

const callOnboard = useThrottleFn(async () => {
  await doLinkedinConnect({});
}, 2000);

const connect = async () => {
  const nango = new Nango({ host: config.nangoUrl });

  try {
    await nango.auth(
      'linkedin',
      `${AuthService.getTenantId()}-linkedin`,
    );
    await callOnboard();
  } catch (e) {
    console.error(e);
  }
};
</script>

<script>
export default {
  name: 'AppLinkedInConnect',
};
</script>
