<template>
  <app-drawer
    v-model="isVisible"
    :size="480"
    title="Manage activity types"
    :show-footer="false"
  >
    <template #content>
      <div class="-mt-4">
        <section class="pb-10">
          <h6
            class="text-base leading-5 font-semibold pb-3"
          >
            Custom
          </h6>
          <div class="mb-4">
            <header class="py-2 border-b border-gray-200">
              <p
                class="text-2xs leading-5 uppercase font-semibold tracking-1 text-gray-400"
              >
                Type
              </p>
            </header>
            <div>
              <div
                v-for="(
                  activityTypes, platform
                ) in types.custom"
                :key="platform"
              >
                <app-activity-type-list-item
                  v-for="(settings, type) in activityTypes"
                  :key="type"
                  :label="settings?.display?.short"
                >
                  <template #after>
                    <app-activity-type-dropdown
                      :activity-type-key="type"
                      :subproject-id="subprojectId"
                      @edit="
                        edit({ ...(settings?.display || {}), key: type })
                      "
                    />
                  </template>
                </app-activity-type-list-item>
              </div>
            </div>
          </div>
          <p
            class="text-sm leading-5 font-medium text-brand-500 cursor-pointer"
            @click="isFormModalOpen = true"
          >
            + Add activity type
          </p>
        </section>
        <section>
          <h6
            class="text-base leading-5 font-semibold pb-3"
          >
            Default
          </h6>
          <div class="mb-4">
            <header
              class="flex py-2 border-b border-gray-200"
            >
              <div class="w-5/12">
                <p
                  class="text-2xs leading-5 uppercase font-semibold tracking-1 text-gray-400"
                >
                  Platform
                </p>
              </div>
              <div class="w-7/12">
                <p
                  class="text-2xs leading-5 uppercase font-semibold tracking-1 text-gray-400"
                >
                  Type
                </p>
              </div>
            </header>
            <div>
              <div
                v-for="integration in activeIntegrations"
                :key="integration.platform"
              >
                <app-activity-type-list-item
                  v-for="(settings, type) in types.default[
                    integration.platform
                  ]"
                  :key="type"
                  :platform="integration.platform"
                  :label="settings.display.short"
                />
              </div>
            </div>
          </div>
        </section>
      </div>
    </template>
  </app-drawer>
  <app-activity-type-form-modal
    v-model="isFormModalOpen"
    :type="editableActivityType"
    :subproject-id="subprojectId"
    @update:model-value="onModalViewChange($event)"
  />
</template>

<script setup>
import {
  defineEmits,
  defineProps,
  computed,
  ref,
  watch,
  onMounted,
} from 'vue';
import { storeToRefs } from 'pinia';
import { useStore } from 'vuex';
import AppDrawer from '@/shared/drawer/drawer.vue';
import AppActivityTypeListItem from '@/modules/activity/components/type/activity-type-list-item.vue';
import AppActivityTypeDropdown from '@/modules/activity/components/type/activity-type-dropdown.vue';
import AppActivityTypeFormModal from '@/modules/activity/components/type/activity-type-form-modal.vue';
import {
  mapGetters,
  mapActions,
} from '@/shared/vuex/vuex.helpers';
import { useActivityTypeStore } from '@/modules/activity/store/type';
import { CrowdIntegrations } from '@/integrations/integrations-config';

// Props & emits
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  subprojectId: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

// Store
const store = useStore();
const { currentTenant } = mapGetters('auth');
const { doFetch } = mapActions('integration');
const activityTypeStore = useActivityTypeStore();
const { types } = storeToRefs(activityTypeStore);
const { setTypes } = activityTypeStore;

// Drawer open
const isFormModalOpen = ref(false);
const editableActivityType = ref(null);
const isVisible = computed({
  get() {
    return props.modelValue;
  },
  set(value) {
    emit('update:modelValue', value);
  },
});

watch(
  () => currentTenant,
  (tenant) => {
    if (tenant.value?.settings.length > 0) {
      setTypes(tenant.value.settings[0].activityTypes);
    }
  },
  { immediate: true, deep: true },
);

const edit = (activityType) => {
  editableActivityType.value = activityType;
  isFormModalOpen.value = true;
};

const onModalViewChange = (opened) => {
  if (!opened) {
    editableActivityType.value = null;
  }
};

const activeIntegrations = computed(() => CrowdIntegrations.mappedEnabledConfigs(
  store,
).filter((integration) => integration.status));

onMounted(() => {
  if (activeIntegrations.value.length === 0) {
    doFetch([props.subprojectId]);
  }
});
</script>

<script>
export default {
  name: 'AppActivityTypeListDrawer',
};
</script>
