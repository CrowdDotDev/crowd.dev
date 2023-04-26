<template>
  <div class="border border-gray-200 rounded-md flex items-center py-4 px-5">
    <div class="w-10">
      <img src="#" class="min-w-full w-10" alt="">
    </div>
    <div class="flex-grow pl-4">
      <h6 class="text-sm font-medium">
        crowd.dev notifier
      </h6>
      <p class="text-2xs leading-4.5 text-gray-600">
        Required to receive notifications in your workspace
      </p>
    </div>
    <div class="pl-3">
      <el-button
        v-if="!form.connected"
        class="btn btn--primary btn--sm !h-8"
        @click="authenticateSlack"
      >
        Install app
      </el-button>
      <div v-else class="flex items-center whitespace-nowrap">
        <span class="ri-check-line text-lg text-darkgreen-900 mr-2" />
        <span class="text-darkgreen-900 text-sm font-medium">App installed</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed, defineEmits, defineProps, onMounted,
} from 'vue';
import useVuelidate from '@vuelidate/core';
import config from '@/config';
import { AuthToken } from '@/modules/auth/auth-token';
import { mapGetters } from '@/shared/vuex/vuex.helpers';

const emit = defineEmits(['update:modelValue']);

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const { currentTenant } = mapGetters('auth');

const defaultValue = {
  connected: true,
};

const form = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

const rules = {
  connected: {
    required: (val) => val,
  },
};

const $v = useVuelidate(rules, form);

const slackConnectUrl = computed(() => {
  const redirectUrl = `${window.location.protocol}//${window.location.host}${window.location.pathname}?activeTab=automations&success=true`;

  return `${config.backendUrl}/tenant/${
    currentTenant.id
  }/automation/slack?redirectUrl=${redirectUrl}&crowdToken=${AuthToken.get()}`;
});
const authenticateSlack = () => {
  window.open(slackConnectUrl.value, '_self');
};

onMounted(() => {
  if (Object.keys(props.modelValue).length === 0) {
    emit('update:modelValue', defaultValue);
  }
});

</script>

<script>
export default {
  name: 'AppAutomationSlackAction',
};
</script>
