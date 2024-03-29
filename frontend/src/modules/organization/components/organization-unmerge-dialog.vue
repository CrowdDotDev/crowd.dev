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
        <el-button class="btn btn--bordered btn--md mr-4" @click="emit('update:modelValue', null)">
          Cancel
        </el-button>
        <el-button
          class="btn btn--primary btn--md"
          :disabled="!selectedIdentity || !preview"
          :loading="unmerging"
          @click="unmerge()"
        >
          Unmerge identity
        </el-button>
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
                    class="bg-brand-500 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium"
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
                    class="bg-brand-500 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium"
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
              <cr-spinner />
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
                        <i class="ri-link-unlink-m mr-1" />Unmerged organization
                      </div>
                      <el-dropdown
                        placement="bottom-end"
                        trigger="click"
                      >
                        <button
                          class="btn btn--link !text-brand-500"
                          type="button"
                          @click.stop
                        >
                          Change identity
                        </button>
                        <template #dropdown>
                          <template
                            v-for="i of identities"
                            :key="`${i.platform}:${i.name}`"
                          >
                            <el-dropdown-item
                              v-if="`${i.platform}:${i.name}` !== selectedIdentity"
                              :value="`${i.platform}:${i.name}`"
                              :label="i.username"
                              @click="fetchPreview(`${i.platform}:${i.name}`)"
                            >
                              <img
                                v-if="platformDetails(i.platform)"
                                class="h-5 w-5 mr-2"
                                :alt="platformDetails(i.platform)?.name"
                                :src="platformDetails(i.platform)?.image"
                              />
                              <span>{{ i.name }}</span>
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
                <div class="ri-fingerprint-line text-5xl text-gray-200" />
              </div>
              <p class="text-center text-xs leading-5 text-gray-500">
                Select the organization identity you want to unmerge
              </p>
              <div class="pt-4">
                <el-select
                  placeholder="Select identity"
                  class="w-full"
                  @update:model-value="fetchPreview($event)"
                >
                  <el-option
                    v-for="i of identities"
                    :key="`${i.platform}:${i.name}`"
                    :value="`${i.platform}:${i.name}`"
                    :label="i.name"
                  >
                    <img
                      v-if="platformDetails(i.platform)"
                      class="h-5 w-5 mr-2"
                      :alt="platformDetails(i.platform)?.name"
                      :src="platformDetails(i.platform)?.image"
                    />
                    {{ i.name }}
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
import CrSpinner from '@/ui-kit/spinner/Spinner.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { OrganizationService } from '@/modules/organization/organization-service';
import AppOrganizationMergeSuggestionsDetails
  from '@/modules/organization/components/suggestions/organization-merge-suggestions-details.vue';

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

const unmerging = ref(false);
const fetchingPreview = ref(false);
const preview = ref(null);
const selectedIdentity = ref(null);

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

const identities = computed(() => {
  if (!props.modelValue?.identities) {
    return [];
  }
  return props.modelValue.identities;
});

const platformDetails = (platform) => CrowdIntegrations.getConfig(platform);

const fetchPreview = (identity) => {
  if (fetchingPreview.value) {
    return;
  }

  selectedIdentity.value = identity;
  fetchingPreview.value = true;

  const [platform, name] = identity.split(':');
  OrganizationService.unmergePreview(props.modelValue?.id, platform, name)
    .then((res) => {
      preview.value = res;
    })
    .catch((error) => {
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

  unmerging.value = true;

  OrganizationService.unmerge(props.modelValue?.id, preview.value)
    .then(() => {
      Message.info(
        'We’re syncing all activities of the unmerged organization. We will let you know once the process is completed.',
        {
          title: 'Organizations unmerging in progress',
        },
      );
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
    fetchPreview(`${props.selectedIdentity.platform}:${props.selectedIdentity.username}`);
  }
});

</script>

<script>
export default {
  name: 'AppOrganizationUnmergeDialog',
};
</script>
