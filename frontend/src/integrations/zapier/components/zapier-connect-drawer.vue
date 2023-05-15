<template>
  <app-drawer
    v-model="isVisible"
    custom-class="integration-reddit-drawer"
    title="Zapier"
    size="480px"
    pre-title="Integration"
    :show-footer="false"
    has-border
    @close="isVisible = false"
  >
    <template #beforeTitle>
      <img
        class="w-6 h-6 mr-2"
        :src="logoUrl"
        alt="Zapier logo"
      />
    </template>
    <template #content>
      <div class="flex flex-row items-center justify-between w-full">
        <p class="font-bold text-base">
          Set up crowd.dev in Zapier
        </p>
        <a
          href="https://docs.crowd.dev/docs/zapier-integration"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn--bordered btn--md"
        ><i class="ri-external-link-line mr-2" />Read our docs</a>
      </div>
      <div class="container flex flex-row w-full items-start py-10">
        <ul class="list-none space-y-4">
          <li class="flex items-start">
            <span
              class="flex-none w-8 h-8 flex justify-center items-center rounded-full bg-gray-300 text-gray-900 font-bold text-sm"
            >1</span>
            <p class="ml-4 text-gray-900 text-xs">
              Navigate to Settings >
              <a
                href="/settings?activeTab=api-keys"
                target="_blank"
                rel="noopener noreferrer"
                class="underline underline-offset-4"
              >API Keys</a>
              and get your workspace
              <span class="font-medium">Tenant ID</span> and
              <span class="font-medium">Auth token</span>
            </p>
          </li>
          <li class="flex items-start">
            <span
              class="flex-none w-8 h-8 flex justify-center items-center rounded-full bg-gray-300 text-gray-900 font-bold text-sm"
            >2</span>
            <p class="ml-4 text-gray-900 text-xs">
              Go to
              <a
                href="https://zapier.com/apps/crowddev/integrations"
                target="_blank"
                rel="noopener noreferrer"
                class="underline underline-offset-4"
              >Zapier</a>
              and connect your crowd.dev account using your workspace API Keys
            </p>
          </li>
          <li class="flex items-center">
            <span
              class="flex-none w-8 h-8 flex justify-center items-center rounded-full bg-gray-300 text-gray-900 font-bold text-sm"
            >3</span>
            <p class="ml-4 text-gray-900 text-xs">
              Learn more about our
              <a
                href="https://docs.crowd.dev/docs/zapier-integration#supported-triggers"
                target="_blank"
                rel="noopener noreferrer"
                class="underline underline-offset-4"
              >supported triggers and actions</a>
            </p>
          </li>
        </ul>
        <!-- <a
          class="btn btn--md btn--primary mt-4 ml-12"
          href=""
          >Explore our Zap templates</a
        > -->
      </div>
    </template>
  </app-drawer>
</template>

<script setup>
import { computed, defineEmits, defineProps } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue']);

const logoUrl = CrowdIntegrations.getConfig('zapier').image;

const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    return emit('update:modelValue', value);
  },
});
</script>

<script>
export default {
  name: 'AppZapierConnectDrawer',
};
</script>
