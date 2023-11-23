<template>
  <div class="mt-10 mb-6 flex justify-center">
    <div class="flex gap-6 items-center limit-width">
      <img
        alt="Crowd logo mini"
        src="/images/logo/crowd-mini.svg"
        class="w-10"
      />
      <div>
        <h3
          class="text-lg font-semibold leading-8"
        >
          Howdie<span v-if="currentUser?.fullName">, {{ currentUser.fullName }}</span>
        </h3>
        <p class="text-sm text-gray-600 leading-5">
          Let's setup your workspace.
        </p>
      </div>
    </div>
  </div>

  <div class="flex justify-center py-8 border-b border-gray-200 sticky top-0 bg-gray-50 z-10">
    <div class="flex gap-10 items-center limit-width">
      <div
        v-for="(step, index) in Object.values(onboardingSteps)"
        :key="step.name"
        class="flex gap-3 items-center"
        :class="{
          'cursor-pointer': index < currentStep - 1,
        }"
        @click="onStepClick(index)"
      >
        <span
          class="w-6 h-6 rounded-full  text-white font-semibold flex items-center justify-center text-sm leading-3.5"
          :class="step.bgColor(currentStep)"
        >{{ index + 1 }}</span>
        <span
          class="font-medium text-sm"
          :class="step.textColor(currentStep)"
        >{{ step.name }}</span>
      </div>
    </div>
  </div>
  <!-- FORM -->
  <div class="flex">
    <div v-if="stepConfig.sideInfo?.length" class="flex-1" />
    <main
      class="limit-width mt-10 mb-30 grow"
      :class="{
        'mb-42': !!stepConfig.submitActionInfo && !$v.$invalid,
      }"
    >
      <component
        :is="stepConfig.component"
        v-model="form"
        @allow-redirect="onConnect"
        @invite-colleagues="onInviteColleagues"
      />
    </main>
    <div v-if="stepConfig.sideInfo?.length" class="flex-1 pr-8 sticky top-21 h-full pt-10">
      <div v-for="{ icon, text } in stepConfig.sideInfo" :key="icon" class="max-w-2xs">
        <i :class="icon" class="text-gray-600 text-base" />
        <div class="text-gray-500 text-xs mt-1">
          {{ text }}
        </div>
      </div>
    </div>
  </div>

  <div class="fixed bottom-0 w-full bg-white flex justify-center py-4 px-8 border-t border-gray-200">
    <div class="limit-width">
      <div
        v-if="!!stepConfig.submitActionInfo && !$v.$invalid"
        class="text-blue-900 bg-blue-50 border border-blue-200 rounded-lg text-xs h-10 flex items-center justify-center mb-3"
      >
        {{ stepConfig.submitActionInfo }}
      </div>
      <el-tooltip
        placement="top"
        :disabled="!stepConfig.ctaTooltip || !$v.$invalid"
        :content="stepConfig.ctaTooltip"
      >
        <div>
          <el-button
            class="btn btn--primary btn--lg btn--full"
            :disabled="$v.$invalid || loadingSubmitAction"
            @click="onBtnClick"
          >
            <span class="text-base">{{ stepConfig.cta }}</span>
            <i class="ri-arrow-right-line text-white text-lg ml-3" />
          </el-button>
        </div>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  reactive, ref, computed, watch, onUnmounted,
} from 'vue';
import {
  mapGetters,
} from '@/shared/vuex/vuex.helpers';
import onboardingSteps from '@/modules/onboard/config/steps';
import useVuelidate from '@vuelidate/core';
import { useStore } from 'vuex';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { useRouter } from 'vue-router';

const router = useRouter();
const store = useStore();

const { currentUser, currentTenant } = mapGetters('auth');

const loadingSubmitAction = ref(false);
const allowRedirect = ref(false);
const currentStep = ref(1);
const form = reactive({
  tenantName: currentTenant.value?.name,
  activeIntegrations: 0,
  invitedUsers: [{
    emails: [],
    roles: ['admin'],
  }],
});

const stepConfig = computed(() => Object.values(onboardingSteps)[currentStep.value - 1]);
const activeIntegrations = computed(() => CrowdIntegrations.mappedEnabledConfigs(
  store,
).filter((integration) => integration.status));

// Prevent window reload when form has changes
const preventWindowReload = (e: BeforeUnloadEvent) => {
  if (!allowRedirect.value) {
    e.preventDefault();
    e.returnValue = '';
  } else {
    allowRedirect.value = false;
  }
};

window.addEventListener('beforeunload', preventWindowReload);

onUnmounted(() => {
  window.removeEventListener(
    'beforeunload',
    preventWindowReload,
  );
});

// If currentTenant, fetch integrations
watch(currentTenant, (tenant, oldTenant) => {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');

  if (tenant?.id === oldTenant?.id) {
    return;
  }

  if (tenant) {
    form.tenantName = tenant.name;
    store.dispatch('integration/doFetch');

    currentStep.value = 2;
  } else if (code) {
    router.replace({ query: {} });
  }
}, {
  deep: true,
  immediate: true,
});

// If currentTenant and activeIntegrations, set second step as the active one
watch(activeIntegrations, (integrations) => {
  form.activeIntegrations = integrations.length;

  if (integrations.length && currentStep.value < 2) {
    currentStep.value = 2;
  }
});

const $v = useVuelidate({}, form);

// Steps Submit action
const onBtnClick = () => {
  loadingSubmitAction.value = true;

  if (currentStep.value === 3) {
    allowRedirect.value = true;
  }

  stepConfig.value.submitAction(form, activeIntegrations.value).then(() => {
    if (currentStep.value < Object.values(onboardingSteps).length) {
      currentStep.value += 1;
    }
  }).finally(() => {
    loadingSubmitAction.value = false;
  });
};

// Click on step tabs
const onStepClick = (index: number) => {
  if (!(index < currentStep.value - 1)) {
    return;
  }

  currentStep.value = index + 1;
};

const onConnect = (val: boolean) => {
  allowRedirect.value = val;
};

const onInviteColleagues = () => {
  currentStep.value = 3;
};
</script>

<style lang="scss" scoped>

.limit-width {
  @apply w-full px-8;
  max-width: 42.75rem;
}
</style>
