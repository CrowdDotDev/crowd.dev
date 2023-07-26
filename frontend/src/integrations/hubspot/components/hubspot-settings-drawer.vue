<template>
  <app-drawer
    v-model="isDrawerVisible"
    title="HubSpot"
    size="600px"
    pre-title="Integration"
    :show-footer="true"
    has-border
    @close="isDrawerVisible = false"
  >
    <template #beforeTitle>
      <img
        :src="hubspotDetails.image"
        class="w-6 h-6 mr-2"
        alt="HubSpot logo"
      />
    </template>
    <template #content>
      <div>
        <section class="pb-6">
          <h4 class="text-base font-semibold pb-1">
            Enable data syncing
          </h4>
          <p class="text-2xs text-gray-500">
            Define which crowd.dev core elements can be synced to or from HubSpot.
          </p>
        </section>
        <section class="pb-10 border-b border-gray-200">
          <article class="border border-gray-200 rounded-t py-4 px-5 flex justify-between">
            <div>
              <h5 class="text-sm font-semibold pb-1">
                Members
              </h5>
              <p class="text-2xs text-gray-500 leading-4.5">
                <span class="font-semibold">Data-in</span>: Existing members will automatically be enriched with data
                points
                from HubSpot contacts every 8 hours.
                <span class="font-semibold">Data-out</span>: To send members to HubSpot, use Automations or select
                members manually.
              </p>
            </div>
            <div>
              <el-switch v-model="form.members" @change="syncSelected($event, 'member')" />
            </div>
          </article>
          <article class="border border-gray-200 rounded-b border-t-0 py-4 px-5 flex justify-between">
            <div>
              <h5 class="text-sm font-semibold pb-1">
                Organizations
              </h5>
              <p class="text-2xs text-gray-500 leading-4.5">
                <span class="font-semibold">Data-in</span>: Existing organizations will automatically be enriched with
                data points from HubSpot companies every 8 hours.
                <span class="font-semibold">Data-out</span>: To send organizations to HubSpot, use Automations or select
                organizations manually.
              </p>
            </div>
            <div>
              <el-switch v-model="form.organizations" @change="syncSelected($event, 'organization')" />
            </div>
          </article>
        </section>
        <section class="pt-6">
          <h4 class="text-base font-semibold pb-2">
            Attributes mapping
          </h4>
          <div class="flex justify-between pb-5">
            <p class="text-2xs text-gray-500">
              Select and map which attributes and properties to sync between crowd.dev and HubSpot.
            </p>
            <div class="pl-8">
              <el-button
                class="btn btn--bordered btn--sm !h-8"
                :disabled="!form.members && !form.organizations"
                :loading="updatingAttributes"
                @click="updateAttributes()"
              >
                <span class="ri-refresh-line mr-2" />
                Update attributes
              </el-button>
            </div>
          </div>
          <div v-if="form.members || form.organizations" class="p-2 rounded bg-blue-50 flex items-center mb-3">
            <span class="ri-information-line text-blue-900 mr-2 text-base h-4 flex items-center" />
            <span class="text-[11px] text-blue-900 leading-4.5">We recommend creating custom properties in Hubspot for every crowd.dev attribute.
              <a
                href="https://go.crowd.dev/hubspot-docs-properties"
                target="_blank"
                rel="noopener noreferrer"
                class="underline text-blue-900 font-medium"
              >Read more</a>
            </span>
          </div>
        </section>
        <section>
          <el-collapse v-model="activeView" accordion class="attributes">
            <el-collapse-item name="member" :disabled="!form.members">
              <template #title>
                <div class="flex justify-between w-full items-center">
                  <div class="flex items-center">
                    <span
                      class="ri-arrow-down-s-line text-lg text-gray-500 mr-3 h-5 flex items-center transition-all transform"
                      :class="{ 'rotate-180': activeView === 'member' }"
                    />
                    <span class="text-xs font-medium">Member attributes</span>
                  </div>
                  <div
                    v-if="form.members"
                    class="h-5 px-2 rounded-full text-3xs flex items-center"
                    :class="memberAttributesSynced > 0 ? 'text-brand-700 bg-brand-50' : 'text-gray-600 bg-gray-100'"
                  >
                    {{ memberAttributesSynced }} attributes synced
                  </div>
                </div>
              </template>

              <div v-if="activeView === 'member'">
                <div class="flex pt-3 pb-2 border-b border-gray-100">
                  <div class="w-1/2 pl-8 text-gray-400 font-semibold tracking-1 text-3xs">
                    CROWD.DEV ATTRIBUTES
                  </div>
                  <div class="w-1/2 pl-8 text-gray-400 font-semibold tracking-1 text-3xs">
                    HUBSPOT PROPERTIES <span class="text-brand-500">*</span>
                  </div>
                </div>
                <section class="pt-1 pb-3">
                  <app-hubspot-property-map
                    v-for="(type, field) in memberMappableFields"
                    :key="field"
                    v-model="form.mapping.members[field]"
                    v-model:enabled="form.enabled.members[field]"
                    :field="field as string"
                    :hubspot-fields="getHubspotMemberFields(type, form.mapping.members[field])"
                  />
                </section>
              </div>
            </el-collapse-item>
            <el-collapse-item name="organization" :disabled="!form.organizations">
              <template #title>
                <div class="flex justify-between w-full items-center">
                  <div class="flex items-center">
                    <span
                      class="ri-arrow-down-s-line text-lg text-gray-500 mr-3 h-5 flex items-center transition-all transform"
                      :class="{ 'rotate-180': activeView === 'organization' }"
                    />
                    <span class="text-xs font-medium">Organization attributes</span>
                  </div>
                  <div
                    v-if="form.organizations"
                    class="h-5 px-2 rounded-full text-3xs flex items-center"
                    :class="organizationAttributesSynced > 0 ? 'text-brand-700 bg-brand-50' : 'text-gray-600 bg-gray-100'"
                  >
                    {{ organizationAttributesSynced }} attributes synced
                  </div>
                </div>
              </template>
              <div v-if="activeView === 'organization'">
                <div class="flex pt-3 pb-2 border-b border-gray-100">
                  <div class="w-1/2 pl-8 text-gray-400 font-semibold tracking-1 text-3xs">
                    CROWD.DEV ATTRIBUTES
                  </div>
                  <div class="w-1/2 pl-8 text-gray-400 font-semibold tracking-1 text-3xs">
                    HUBSPOT PROPERTIES <span class="text-brand-500">*</span>
                  </div>
                </div>
                <section class="pt-1 pb-3">
                  <app-hubspot-property-map
                    v-for="(type, field) in organizationMappableFields"
                    :key="field"
                    v-model="form.mapping.organizations[field]"
                    v-model:enabled="form.enabled.organizations[field]"
                    :field="field as string"
                    :hubspot-fields="getHubspotOrganizationFields(type, form.mapping.organizations[field])"
                  />
                </section>
              </div>
            </el-collapse-item>
          </el-collapse>
        </section>
      </div>
    </template>

    <template #footer>
      <div style="flex: auto">
        <el-button
          class="btn btn--md btn--bordered mr-3"
          @click="isDrawerVisible = false"
        >
          Cancel
        </el-button>
        <el-button
          type="primary"
          class="btn btn--md btn--primary"
          :disabled="!isMappingValid || loading"
          :loading="loading"
          @click="update()"
        >
          Update
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script lang="ts" setup>
import {
  computed, onMounted, reactive, ref,
} from 'vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { HubspotApiService } from '@/integrations/hubspot/hubspot.api.service';
import { MappableFields } from '@/integrations/hubspot/types/MappableFields';
import { useStore } from 'vuex';
import { HubspotOnboard } from '@/integrations/hubspot/types/HubspotOnboard';
import { HubspotEntity } from '@/integrations/hubspot/types/HubspotEntity';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import AppHubspotPropertyMap from '@/integrations/hubspot/components/hubspot-property-map.vue';

const props = defineProps<{
  modelValue: boolean
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void }>();

const store = useStore();
const { doFetch } = mapActions('integration');

const activeView = ref<string | null>(null);

const memberMappableFields = ref<Record<string, string>>({});
const organizationMappableFields = ref<Record<string, string>>({});

const isDrawerVisible = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});

const form = reactive({
  members: false,
  organizations: false,
  enabled: {
    members: {},
    organizations: {},
  },
  mapping: {
    members: {},
    organizations: {},
  },
});

const loading = ref<boolean>(false);
const updatingAttributes = ref<boolean>(false);

const usedHubspotMemberFields = computed(() => Object.values(form.mapping.members));
const usedHubspotOrganizationFields = computed(() => Object.values(form.mapping.organizations));

const getHubspotProperties = ref({});

const getHubspotMemberFields = (type: string, name: string) => {
  const fields = getHubspotProperties.value.members;
  return fields.filter((field) => {
    if (field.name === name) {
      return true;
    }
    return !(field.type !== type || usedHubspotMemberFields.value.includes(field.name));
  });
};

const getHubspotOrganizationFields = (type: string, name: string) => {
  const fields = getHubspotProperties.value.organizations;
  return fields.filter((field) => {
    if (field.name === name) {
      return true;
    }
    return !(field.type !== type || usedHubspotOrganizationFields.value.includes(field.name));
  });
};

const hubspotDetails = computed(() => CrowdIntegrations.getConfig('hubspot'));

const updateAttributes = () => {
  updatingAttributes.value = true;
  HubspotApiService.updateAttributes()
    .then((res) => {
      getHubspotProperties.value = res;
    })
    .finally(() => {
      updatingAttributes.value = false;
    });
};

const syncSelected = (value: boolean, attribute: string) => {
  if (value) {
    activeView.value = attribute;
  } else if (activeView.value === attribute) {
    activeView.value = null;
  }
};

const memberAttributesSynced = computed(() => Object.keys(form.enabled.members).filter((key) => form.enabled.members[key]).length);
const organizationAttributesSynced = computed(() => Object.keys(form.enabled.organizations).filter((key) => form.enabled.organizations[key]).length);

const isMappingValid = computed(() => {
  const memberKeys = Object.keys(form.enabled.members).filter((key) => form.enabled.members[key]);
  const organizationKeys = Object.keys(form.enabled.organizations).filter((key) => form.enabled.organizations[key]);
  const memberValid = memberKeys.every((key) => form.mapping.members[key]?.length > 0);
  const organizationValid = organizationKeys.every((key) => form.mapping.organizations[key]?.length > 0);
  return (!form.members || (memberValid && memberKeys.length > 0))
    && (!form.organizations || (organizationValid && organizationKeys.length > 0))
    && (form.members || form.organizations);
});

const update = () => {
  if (!isMappingValid.value) {
    return;
  }
  const data: HubspotOnboard = {
    enabledFor: [
      ...(form.members ? [HubspotEntity.MEMBERS] : []),
      ...(form.organizations ? [HubspotEntity.ORGANIZATIONS] : []),
    ],
    attributesMapping: {
      members: {},
      organizations: {},
    },
  };
  if (form.members) {
    const memberKeys = Object.keys(form.enabled.members).filter((key) => form.enabled.members[key]);
    data.attributesMapping.members = memberKeys.reduce((a, b) => ({
      ...a,
      [b]: form.mapping.members[b],
    }), {});
  }
  if (form.organizations) {
    const organizationKeys = Object.keys(form.enabled.organizations).filter((key) => form.enabled.organizations[key]);
    data.attributesMapping.organizations = organizationKeys.reduce((a, b) => ({
      ...a,
      [b]: form.mapping.organizations[b],
    }), {});
  }
  loading.value = true;
  HubspotApiService.finishOnboard(data)
    .then(() => {
      doFetch(null);
      isDrawerVisible.value = false;
    })
    .finally(() => {
      loading.value = false;
    });
};

const fillForm = (data: HubspotOnboard) => {
  form.members = data.enabledFor.includes(HubspotEntity.MEMBERS);
  form.organizations = data.enabledFor.includes(HubspotEntity.ORGANIZATIONS);

  form.mapping.members = data.attributesMapping[HubspotEntity.MEMBERS];
  form.mapping.organizations = data.attributesMapping[HubspotEntity.ORGANIZATIONS];

  form.enabled.members = Object.keys(data.attributesMapping[HubspotEntity.MEMBERS]).reduce((a, b) => ({
    ...a,
    [b]: true,
  }), {});

  form.enabled.organizations = Object.keys(data.attributesMapping[HubspotEntity.ORGANIZATIONS]).reduce((a, b) => ({
    ...a,
    [b]: true,
  }), {});
};

onMounted(() => {
  updateAttributes();
  HubspotApiService.getMappableFields()
    .then((mappableData: MappableFields) => {
      memberMappableFields.value = mappableData.members;
      organizationMappableFields.value = mappableData.organizations;
    });

  const data = CrowdIntegrations.getMappedConfig('hubspot', store);
  fillForm(data.settings);
});

</script>

<script lang="ts">
export default {
  name: 'AppHubspotSettingsDrawer',
};
</script>

<style lang="scss">
.el-collapse.attributes {
  @apply border-0;
}

.el-collapse-item {
  .el-collapse-item__header {
    @apply h-14 border-0;
  }

  &:not(:last-child){
    @apply border-b border-gray-100;
  }

  .el-collapse-item__arrow {
    @apply hidden;
  }
}

.el-select.map-attribute{
  .el-input {
    @apply min-h-8 bg-gray-50;

    .el-input__wrapper{
      @apply bg-gray-50;
    }

    .el-input__suffix-inner {
      top: 0.5rem;
    }
  }
}

.c-select{
  @apply w-full h-8 bg-gray-50 border border-gray-100 rounded-md px-2 text-2xs text-gray-600;
}
</style>
