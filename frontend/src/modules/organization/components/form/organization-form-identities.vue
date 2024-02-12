<template>
  <div>
    <section
      v-for="[key, value] in Object.entries(identitiesForm)"
      :key="key"
      class="border-b border-gray-200 last:border-none pt-5 pb-6"
    >
      <div v-if="findPlatform(key)" class="flex">
        <div class="w-6 pt-2 mr-4">
          <img
            :src="findPlatform(key).image"
            :alt="findPlatform(key).name"
            class="w-6"
          />
        </div>
        <div class="flex-grow">
          <template v-for="(identity, ii) of model" :key="ii">
            <article
              v-if="identity.platform === key"
              class="flex flex-grow gap-2 pb-3 last:pb-0"
            >
              <el-input
                v-model="model[ii].username"
                :placeholder="identity.name.length ? identity.name : 'johndoe'"
              >
                <template #prepend>
                  <span class="font-medium text-gray-500">{{ value.urlPrefix }}</span>
                </template>
              </el-input>
              <el-button
                :disabled="editingDisabled(key)"
                class="btn btn--md btn--transparent w-10 h-10"
                @click="removeUsername(ii)"
              >
                <i class="ri-delete-bin-line text-lg" />
              </el-button>
            </article>
          </template>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import {
  computed, reactive, ref, watch,
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
});

// TODO: move this to identities config
const identitiesForm = {
  github: {
    urlPrefix: 'github.com/',
  },
  linkedin: {
    urlPrefix: 'linkedin.com/company/',
  },
  twitter: {
    urlPrefix: 'twitter.com/',
  },
  crunchbase: {
    urlPrefix: 'crunchbase.com/organization/',
  },
};

const model = ref([]);

watch(
  props.modelValue,
  (organization, previous) => {
    if (!previous) {
      const identities = organization.identities.map((i) => ({
        ...i,
        username: i.url ? i.url.split('/').at(-1) : '',
      }));
      const platforms = [...new Set(organization.identities.map((i) => i.platform))];
      const noIdentity = Object.keys(identitiesForm)
        .filter((platform) => !platforms.includes(platform))
        .map((platform) => (reactive({
          name: '',
          platform,
          url: null,
          username: '',
        })));

      model.value = [
        ...identities,
        ...noIdentity,
      ];
    }
  },
  { deep: true, immediate: true },
);

const existingIdentities = computed(() => (props.record?.identities || []).map((i) => ({
  ...i,
  username: i.url ? i.url.split('/').at(-1) : '',
})));

watch(
  model,
  (value) => {
    // Parse username object

    const identities = value
      .filter((i) => !Object.keys(identitiesForm).includes(i.platform) || !!i.username?.trim().length)
      .map((i) => {
        const existingOnes = existingIdentities.value.filter((id) => id.platform === i.platform);
        const index = value
          .filter((id) => id.platform === i.platform)
          .findIndex((id) => id.username === i.username);
        const existingOne = index >= 0 ? existingOnes[index] : null;
        return {
          ...i,
          name: !existingOne || existingOne.username !== i.username ? i.username || i.name : i.name,
          url: i.username?.length ? `https://${identitiesForm[i.platform]?.urlPrefix}${i.username}` : null,
        };
      });

    // Emit updated member
    emit('update:modelValue', {
      ...props.modelValue,
      identities,
    });
  },
  { deep: true },
);

function findPlatform(platform) {
  return CrowdIntegrations.getConfig(platform);
}

function editingDisabled(platform) {
  return model.value.filter((i) => i.platform === platform).length < 2;
}

const removeUsername = (index) => {
  if (model.value.length > 1) {
    model.value.splice(index, 1);
  } else if (model.value.length > 0) {
    model.value[0] = '';
  }
};
</script>

<script>
export default {
  name: 'AppOrganizationFormIdentities',
};
</script>
