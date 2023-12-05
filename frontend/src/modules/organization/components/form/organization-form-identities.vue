<template>
  <div class="grid gap-x-12 grid-cols-3">
    <h6>Identities</h6>
    <div class="col-span-2 organization-identities-form">
      <div
        v-for="[key, value] in Object.entries(
          identitiesForm,
        )"
        :key="key"
        class="border-b border-gray-200 last:border-none"
      >
        <div v-if="findPlatform(key)">
          <el-form-item class="h-14 !flex items-center w-full mb-0">
            <div :class="value.imgContainerClass">
              <img
                :src="findPlatform(key).image"
                :alt="findPlatform(key).name"
                class="w-4"
              />
            </div>
            <el-switch
              v-model="value.enabled"
              :inactive-text="findPlatform(key).name"
              @change="
                (newValue) => onSwitchChange(newValue, key)
              "
            />
          </el-form-item>
          <template v-for="(identity, ii) of model.identities" :key="`${identity}${ii}`">
            <div v-if="value.enabled && identity.platform === key">
              <div
                class="flex flex-grow gap-2 mt-1 pb-3 last:!mb-6 last:pb-0"
              >
                <el-form-item
                  :prop="`identities.${ii}.username`"
                  required
                  class="flex-grow"
                >
                  <el-input
                    v-model="model.identities[ii].username"
                    :placeholder="identity.name.length ? identity.name : 'johndoe'"
                    @input="(newValue) =>
                      onInputChange(newValue, key, value, ii)
                    "
                  >
                    <template #prepend>
                      <span>{{ value.urlPrefix }}</span>
                      <span class="text-brand-500">*</span>
                    </template>
                  </el-input>
                  <template #error>
                    <div class="el-form-item__error">
                      Identity profile is required
                    </div>
                  </template>
                </el-form-item>

                <el-button
                  class="btn btn--md btn--transparent w-10 h-10"
                  @click="removeUsername(ii)"
                >
                  <i class="ri-delete-bin-line text-lg" />
                </el-button>
              </div>
            </div>
          </template>
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
import {
  computed, defineEmits, defineProps, reactive,
} from 'vue';
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

const identitiesForm = reactive({
  github: {
    label: 'GitHub',
    enabled:
      props.modelValue.identities?.some((el) => el.platform === 'github')
      || false,
    urlPrefix: 'github.com/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base bg-gray-100 border border-gray-200',
  },
  linkedin: {
    label: 'LinkedIn',
    enabled:
      props.modelValue.identities?.some((el) => el.platform === 'linkedin')
      || false,
    urlPrefix: 'linkedin.com/company/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--linkedin',
  },
  twitter: {
    label: 'X/Twitter',
    enabled:
      props.modelValue.identities?.some((el) => el.platform === 'twitter')
      || false,
    urlPrefix: 'twitter.com/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base btn--twitter',
  },
  crunchbase: {
    label: 'Crunchbase',
    enabled:
      props.modelValue.identities?.some((el) => el.platform === 'crunchbase')
      || false,
    urlPrefix: 'crunchbase.com/organization/',
    imgContainerClass:
      'h-8 w-8 rounded flex items-center justify-center text-base platform-logo--crunchbase',
  },
});

function findPlatform(platform) {
  return CrowdIntegrations.getConfig(platform);
}

function onInputChange(newValue, key, value, index) {
  model.value.identities[index] = {
    ...props.modelValue.identities[index],
    name: newValue,
    url: newValue.length ? `https://${value.urlPrefix}${newValue}` : null,
  };
}

function platformInIdentities(platform) {
  return props.modelValue.identities.filter((i) => i.platform === platform);
}

function onSwitchChange(value, key) {
  // Add platform to identities array
  if (
    (platformInIdentities(key).length === 0)
    && value
  ) {
    model.value.identities.push({
      name: '',
      platform: key,
    });
    return;
  }

  // Remove platform from identities array
  if (!value) {
    model.value.identities = model.value.identities.filter((i) => i.platform !== key);
  }
}

const removeUsername = (index) => {
  const element = model.value.identities[index];
  model.value.identities.splice(index, 1);

  if (platformInIdentities(element.platform).length === 0) {
    identitiesForm[element.platform].enabled = false;
  }
};

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
