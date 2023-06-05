<template>
  <div class="grid gap-x-12 grid-cols-3">
    <h6>Identities</h6>
    <div class="col-span-2 organization-identities-form">
      <div
        v-for="platform of platforms"
        :key="platform.name"
        class="platform"
      >
        <div class="flex items-center">
          <div
            class="platform-logo mr-3"
            :class="platform.imgContainerClass"
          >
            <img
              :src="findPlatform(platform.name).image"
              :alt="findPlatform(platform.name).name"
              :class="
                platform.name === 'crunchbase'
                  ? 'w-5 h-4'
                  : 'w-4 h-4'
              "
            />
          </div>
          <div class="font-medium">
            {{ platform.label }}
          </div>
        </div>
        <div class="flex items-center grow justify-end">
          <div class="text-gray-400 text-right mr-3">
            {{ platform.prefix }}
          </div>
          <el-input
            v-model="model[platform.name]"
            class="!w-64"
          />
        </div>
      </div>
      <div class="flex items-start justify-between mt-16">
        <div class="flex items-center">
          <app-platform platform="email" />
          <div class="font-medium text-sm ml-3">
            Email address
          </div>
        </div>
        <app-string-array-input
          v-model="model.emails"
          class="w-64"
          add-row-label="Add e-email address"
        />
      </div>
      <div class="flex items-start justify-between mt-16">
        <div class="flex items-center">
          <app-platform platform="phone" />
          <div class="font-medium text-sm ml-3">
            Phone number
          </div>
        </div>
        <app-string-array-input
          v-model="model.phoneNumbers"
          class="w-64"
          add-row-label="Add phone number"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, defineEmits, defineProps } from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const emit = defineEmits(['update:modelValue']);
const props = defineProps({
  modelValue: {
    type: Object,
    default: () => {},
  },
  record: {
    type: Object,
    default: () => {},
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
});
const model = computed({
  get() {
    return props.modelValue;
  },
  set(newModel) {
    emit('update:modelValue', newModel);
  },
});

function findPlatform(platform) {
  return CrowdIntegrations.getConfig(platform);
}

const platforms = [
  {
    name: 'github',
    label: 'GitHub',
    prefix: 'github.com/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base bg-gray-100 border border-gray-200',
  },
  {
    name: 'linkedin',
    label: 'LinkedIn',
    prefix: 'linkedin.com/company/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base platform-logo--linkedin',
  },
  {
    name: 'twitter',
    label: 'Twitter',
    prefix: 'twitter.com/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base platform-logo--twitter',
  },
  {
    name: 'crunchbase',
    label: 'Crunchbase',
    prefix: 'crunchbase.com/organization/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base platform-logo--crunchbase',
  },
];
</script>

<style lang="scss">
.organization-identities-form {
  .platform {
    @apply flex items-center justify-between w-full mb-3 text-sm flex-wrap gap-2;
    &-logo {
      @apply h-8 w-8 rounded flex items-center justify-center text-base;
      &--github {
        @apply bg-gray-100 border border-gray-200;
      }

      &--twitter {
        background: rgba(29, 155, 240, 0.15);
      }

      &--crunchbase {
        background: rgba(20, 106, 255, 0.15);
      }

      &--linkedin {
        @apply bg-white border border-gray-200;
      }

      &--email {
        @apply leading-none cursor-pointer bg-white text-gray-600 border border-gray-200;
      }
    }
  }
}
</style>
