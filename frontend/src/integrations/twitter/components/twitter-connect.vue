<template>
  <app-twitter-connect-modal
    v-model="modalVisible"
  />
  <slot
    :connect="connect"
  />
</template>

<script setup>
import {
  ref,
} from 'vue';
import AppTwitterConnectModal from '@/integrations/twitter/components/twitter-connect-modal.vue';

const modalVisible = ref(false);

const connect = () => {
  modalVisible.value = true;
};
</script>

<script>
export default {
  name: 'AppTwitterConnect',
};
</script>
