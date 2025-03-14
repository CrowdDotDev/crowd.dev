<template>
  <app-dialog
    v-if="isModalOpen"
    v-model="isModalOpen"
    title="Unmerge identity"
    size="2extra-large"
    custom-class="p-0 !mt-5"
  >
    <template #header>
      <h3 class="text-lg font-semibold">
        Unmerge identity
      </h3>
    </template>
    <template #headerActions>
      <div class="flex justify-end -my-1">
        <lf-button
          type="secondary"
          size="medium"
          class="mr-4"
          @click="emit('update:modelValue', null)"
        >
          Cancel
        </lf-button>
        <lf-button
          type="primary"
          size="medium"
          :disabled="!selectedIdentity || !preview"
          :loading="unmerging"
          @click="unmerge()"
        >
          Unmerge identity
        </lf-button>
      </div>
    </template>
    <template #content>
      <div class="p-6 relative border-t">
        <div class="flex -mx-3">
          <div class="w-1/2 px-3">
            <!-- Loading preview -->
            <app-organization-merge-suggestions-details
              v-if="!preview && props.modelValue"
              :organization="props.modelValue"
              :is-primary="true"
            >
              <template #header>
                <div class="h-13 flex justify-between items-start">
                  <div
                    class="bg-primary-500 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium"
                  >
                    Current organization
                  </div>
                </div>
              </template>
            </app-organization-merge-suggestions-details>
            <app-organization-merge-suggestions-details
              v-else-if="preview"
              :organization="preview.primary"
              :compare-organization="preview.secondary"
              :is-primary="true"
              :is-preview="true"
            >
              <template #header>
                <div class="h-13 flex justify-between items-start">
                  <div
                    class="bg-primary-500 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium"
                  >
                    Updated organization
                  </div>
                </div>
              </template>
            </app-organization-merge-suggestions-details>
          </div>
          <div class="w-1/2 px-3">
            <!-- Loading preview -->
            <div v-if="fetchingPreview" class="flex items-center justify-center pt-40 w-full">
              <lf-spinner />
            </div>
            <!-- Unmerge preview -->
            <div v-else-if="preview">
              <app-organization-merge-suggestions-details
                :organization="preview.secondary"
                :compare-organization="preview.primary"
                :is-preview="true"
              >
                <template #header>
                  <div class="h-13">
                    <div class="flex justify-between items-start">
                      <div
                        class="bg-gray-100 rounded-full py-0.5 px-2 text-gray-600 inline-block text-xs leading-5 font-medium"
                      >
                        <lf-icon name="link-slash" :size="16" class="mr-1" />
                        Unmerged organization
                      </div>
                      <el-dropdown
                        placement="bottom-end"
                        trigger="click"
                      >
                        <button
                          class="btn btn--link !text-primary-500"
                          type="button"
                          @click.stop
                        >
                          Change identity
                        </button>
                        <template #dropdown>
                          <template
                            v-for="i of identities"
                            :key="i.id"
                          >
                            <el-dropdown-item
                              v-if="i.id !== selectedIdentity.id"
                              :value="i"
                              :label="i.displayValue"
                              @click="fetchPreview(i)"
                            >
                              <lf-icon v-if="i.type === 'email'" name="envelope" :size="20" class="text-gray-900 leading-5 mr-2" />
                              <lf-icon
                                v-else-if="['primary-domain', 'alternative-domain', 'affiliated-profile'].includes(i.type)"
                                name="window"
                                :size="20"
                                class="text-gray-900 text-lg leading-5 mr-2"
                              />
                              <img
                                v-else-if="lfIdentities[i.platform]"
                                class="h-5 min-w-5 mr-2"
                                :alt="lfIdentities[i.platform]?.name"
                                :src="lfIdentities[i.platform]?.image"
                              />
                              <lf-icon
                                v-else
                                name="fingerprint"
                                :size="20"
                                class="text-gray-600 mr-2"
                              />
                              <span>{{ i.displayValue }}</span>
                            </el-dropdown-item>
                          </template>
                        </template>
                      </el-dropdown>
                    </div>
                  </div>
                </template>
              </app-organization-merge-suggestions-details>
            </div>
            <!-- Identity selection -->
            <div v-else class="pt-14">
              <div class="flex justify-center pb-5">
                <lf-icon name="fingerprint" :size="64" class="text-gray-200" />
              </div>
              <p class="text-center text-xs leading-5 text-gray-500">
                Select the organization identity you want to unmerge
              </p>
              <div class="pt-4">
                <el-select
                  placeholder="Select identity"
                  class="w-full"
                  value-key="id"
                  @update:model-value="fetchPreview($event)"
                >
                  <el-option
                    v-for="i of identities"
                    :key="i.id"
                    :value="i"
                    :label="i.displayValue"
                  >
                    <lf-icon v-if="i.type === 'email'" name="envelope" :size="20" class="text-gray-900 leading-5 mr-2" />
                    <lf-icon
                      v-else-if="['primary-domain', 'alternative-domain', 'affiliated-profile'].includes(i.type)"
                      name="window"
                      size="20"
                      class="text-gray-900 text-lg leading-5 mr-2"
                    />
                    <img
                      v-else-if="lfIdentities[i.platform]"
                      class="h-5 min-w-5 mr-2"
                      :alt="lfIdentities[i.platform]?.name"
                      :src="lfIdentities[i.platform]?.image"
                    />
                    <lf-icon
                      v-else
                      name="fingerprint"
                      :size="20"
                      class="text-gray-600 mr-2"
                    />
                    {{ i.displayValue }}
                  </el-option>
                </el-select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue';
import Message from '@/shared/message/message';
import AppDialog from '@/shared/dialog/dialog.vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import { OrganizationService } from '@/modules/organization/organization-service';
import AppOrganizationMergeSuggestionsDetails
  from '@/modules/organization/components/suggestions/organization-merge-suggestions-details.vue';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import { Platform } from '@/shared/modules/platform/types/Platform';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { lfIdentities } from '@/config/identities';
import LfButton from '@/ui-kit/button/Button.vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  selectedIdentity: {
    type: Object,
    required: false,
    default: () => null,
  },
});

const emit = defineEmits(['update:modelValue']);

const { trackEvent } = useProductTracking();

const unmerging = ref(false);
const fetchingPreview = ref(false);
const preview = ref(null);
const selectedIdentity = ref(null);

const { getOrganizationMergeActions, fetchOrganization } = useOrganizationStore();

const parseIdentityValues = (identity) => {
  const splittedIdentity = identity.value?.split(':');

  if (identity.platform === Platform.LINKEDIN && splittedIdentity.length === 2) {
    return {
      ...identity,
      id: `${identity.platform}:${identity.value}:${identity.type}:${identity.verified}`,
      value: identity.value,
      displayValue: splittedIdentity[1],
    };
  }

  return {
    ...identity,
    id: `${identity.platform}:${identity.value}:${identity.type}:${identity.verified}`,
    displayValue: identity.value,
  };
};

const isModalOpen = computed({
  get() {
    return props.modelValue !== null;
  },
  set() {
    emit('update:modelValue', null);
    fetchingPreview.value = false;
    selectedIdentity.value = null;
    preview.value = null;
  },
});

const identityOrder = [
  'username',
  'primary-domain',
  'alternative-domain',
  'affiliated-profile',
  'email',
];

const identities = computed(() => {
  if (!props.modelValue?.identities) {
    return [];
  }
  return (props.modelValue.identities || [])
    .sort((a, b) => {
      const aIndex = identityOrder.indexOf(a.type);
      const bIndex = identityOrder.indexOf(b.type);
      const aOrder = aIndex !== -1 ? aIndex : identityOrder.length;
      const bOrder = bIndex !== -1 ? bIndex : identityOrder.length;
      return aOrder - bOrder;
    })
    .map((i) => parseIdentityValues(i));
});

const fetchPreview = (identity) => {
  if (fetchingPreview.value) {
    return;
  }

  selectedIdentity.value = identity;
  fetchingPreview.value = true;

  const {
    platform, value, type, verified,
  } = identity;
  const foundIdentity = identities.value.find((i) => i.platform === platform && i.value === value && i.type === type);
  OrganizationService.unmergePreview(props.modelValue?.id, foundIdentity)
    .then((res) => {
      preview.value = res;
    })
    .catch(() => {
      Message.error('There was an error fetching unmerge preview');
    })
    .finally(() => {
      fetchingPreview.value = false;
    });
};

const unmerge = () => {
  if (unmerging.value) {
    return;
  }

  trackEvent({
    key: FeatureEventKey.UNMERGE_ORGANIZATION_IDENTITY,
    type: EventType.FEATURE,
    properties: {
      identity: selectedIdentity.value,
    },
  });

  unmerging.value = true;

  OrganizationService.unmerge(props.modelValue?.id, preview.value)
    .then(() => {
      getOrganizationMergeActions(props.modelValue?.id);
      Message.info(
        'We’re syncing all activities of the unmerged organization. We will let you know once the process is completed.',
        {
          title: 'Organizations unmerging in progress',
        },
      );
      fetchOrganization(props.modelValue?.id);
      emit('update:modelValue', null);
    })
    .catch(() => {
      Message.error('There was an error unmerging organization');
    })
    .finally(() => {
      unmerging.value = false;
    });
};

onMounted(() => {
  if (props.selectedIdentity) {
    const identity = parseIdentityValues(props.selectedIdentity);

    fetchPreview(identity);
  }
});

</script>

<script>
export default {
  name: 'AppOrganizationUnmergeDialog',
};
</script>
