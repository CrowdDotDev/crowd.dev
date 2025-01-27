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
            <app-member-suggestions-details
              v-if="!preview && props.modelValue"
              :member="props.modelValue"
              :is-primary="true"
            >
              <template #header>
                <div class="h-13 flex justify-between items-start">
                  <div
                    class="bg-primary-500 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium"
                  >
                    Current profile
                  </div>
                </div>
              </template>
              <template #property>
                <article
                  v-if="props.modelValue.activityCount"
                  class="pb-4"
                >
                  <p class="text-2xs font-medium text-gray-500 pb-1">
                    Activity count
                  </p>
                  <p class="text-xs text-gray-900 whitespace-normal">
                    {{ props.modelValue.activityCount || '-' }}
                  </p>
                </article>
              </template>
              <template #below>
                <div v-if="props.modelValue?.organizations?.length" class="pt-8">
                  <h6 class="text-sm font-semibold text-black pb-4">
                    Organizations
                  </h6>
                  <app-member-organization-list :member="props.modelValue" />
                </div>
              </template>
            </app-member-suggestions-details>
            <app-member-suggestions-details
              v-else-if="preview"
              :member="preview.primary"
              :compare-member="preview.secondary"
              :is-primary="true"
            >
              <template #header>
                <div class="h-13 flex justify-between items-start">
                  <div
                    class="bg-primary-500 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium"
                  >
                    Updated profile
                  </div>
                </div>
              </template>
              <template #property>
                <article
                  v-if="preview.primary.activityCount || preview.secondary.activityCount"
                  class="pb-4"
                >
                  <p class="text-2xs font-medium text-gray-500 pb-1">
                    Activity count
                  </p>
                  <p class="text-xs text-gray-900 whitespace-normal">
                    {{ preview.primary.activityCount || '-' }}
                  </p>
                </article>
              </template>
              <template #engagementLevel>
                <div class="flex items-center">
                  <div class="border border-gray-200 bg-gray-100 py-px px-1.5 text-gray-600 text-xs leading-5 rounded-md mr-1">
                    Unknown
                  </div>
                  <el-tooltip content="Calculated after profile is unmerged" placement="top">
                    <lf-icon name="circle-question" :size="16" class="text-gray-400" />
                  </el-tooltip>
                </div>
              </template>
              <template #below>
                <div v-if="preview.primary?.organizations?.length" class="pt-8">
                  <h6 class="text-sm font-semibold text-black pb-4">
                    Organizations
                  </h6>
                  <app-member-organization-list :member="preview.primary" />
                </div>
              </template>
            </app-member-suggestions-details>
          </div>
          <div class="w-1/2 px-3">
            <!-- Loading preview -->
            <div v-if="fetchingPreview" class="flex items-center justify-center pt-40 w-full">
              <lf-spinner />
            </div>
            <!-- Unmerge preview -->
            <div v-else-if="preview">
              <app-member-suggestions-details
                :member="preview.secondary"
                :compare-member="props.modelValue"
              >
                <template #header>
                  <div class="h-13">
                    <div class="flex justify-between items-start">
                      <div
                        class="bg-gray-100 rounded-full py-0.5 px-2 text-gray-600 inline-block text-xs leading-5 font-medium"
                      >
                        <lf-icon name="link-simple-slash" :size="16" class="mr-1" />
                        Unmerged profile
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
                              v-if="i.id !== selectedIdentity"
                              :value="i.id"
                              :label="i.value"
                              @click="fetchPreview(i.id)"
                            >
                              <lf-icon
                                v-if="i.type === 'email'"
                                name="envelope"
                                :size="20"
                                class="text-gray-900 leading-5 mr-2"
                              />
                              <img
                                v-else-if="lfIdentities[i.platform]"
                                class="h-5 w-5 mr-2"
                                :alt="lfIdentities[i.platform]?.name"
                                :src="lfIdentities[i.platform]?.image"
                              />
                              <lf-icon
                                v-else
                                name="fingerprint"
                                :size="20"
                                class="text-gray-600 mr-2"
                              />
                              <span>{{ i.value }}</span>
                            </el-dropdown-item>
                          </template>
                        </template>
                      </el-dropdown>
                    </div>
                  </div>
                </template>
                <template #engagementLevel>
                  <div class="flex items-center">
                    <div class="border border-gray-200 bg-gray-100 py-px px-1.5 text-gray-600 text-xs leading-5 rounded-md mr-1">
                      Unknown
                    </div>
                    <el-tooltip content="Calculated after profile is unmerged" placement="top">
                      <lf-icon name="circle-question" :size="16" class="text-gray-400" />
                    </el-tooltip>
                  </div>
                </template>
                <template #property>
                  <article
                    v-if="preview.primary.activityCount || preview.secondary.activityCount"
                    class="pb-4"
                  >
                    <p class="text-2xs font-medium text-gray-500 pb-1">
                      Activity count
                    </p>
                    <p class="text-xs text-gray-900 whitespace-normal">
                      {{ preview.secondary.activityCount || '-' }}
                    </p>
                  </article>
                </template>
                <template #below>
                  <div v-if="preview.secondary?.organizations?.length" class="pt-8">
                    <h6 class="text-sm font-semibold text-black pb-4">
                      Organizations
                    </h6>
                    <app-member-organization-list :member="preview.secondary" />
                  </div>
                </template>
              </app-member-suggestions-details>
            </div>
            <!-- Identity selection -->
            <div v-else class="pt-14">
              <div class="flex justify-center pb-5">
                <lf-icon name="fingerprint" :size="64" class="text-gray-200" />
              </div>
              <p class="text-center text-xs leading-5 text-gray-500">
                Select the profile identity you want to unmerge
              </p>
              <div class="pt-4">
                <el-select
                  placeholder="Select identity"
                  class="w-full"
                  @update:model-value="fetchPreview($event)"
                >
                  <el-option
                    v-for="i of identities"
                    :key="i.id"
                    :value="i.id"
                    :label="i.value"
                  >
                    <lf-icon
                      v-if="i.type === 'email'"
                      name="envelope"
                      :size="20"
                      class="text-gray-900 leading-5 mr-2"
                    />
                    <img
                      v-else-if="lfIdentities[i.platform]"
                      class="h-5 w-5 mr-2"
                      :alt="lfIdentities[i.platform]?.name"
                      :src="lfIdentities[i.platform]?.image"
                    />
                    <lf-icon
                      v-else
                      name="fingerprint"
                      :size="20"
                      class="text-gray-600 mr-2"
                    />
                    {{ i.value }}
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

import { MemberService } from '@/modules/member/member-service';
import Message from '@/shared/message/message';
import AppDialog from '@/shared/dialog/dialog.vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import AppMemberOrganizationList from '@/modules/member/components/suggestions/member-organizations-list.vue';
import useProductTracking from '@/shared/modules/monitoring/useProductTracking';
import { EventType, FeatureEventKey } from '@/shared/modules/monitoring/types/event';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { useContributorStore } from '@/modules/contributor/store/contributor.store';
import { useRouter } from 'vue-router';
import { lfIdentities } from '@/config/identities';
import AppMemberSuggestionsDetails from './suggestions/member-merge-suggestions-details.vue';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  selectedIdentity: {
    type: String,
    required: false,
    default: () => null,
  },
});

const emit = defineEmits(['update:modelValue']);

const router = useRouter();

const { trackEvent } = useProductTracking();

const { getContributor } = useContributorStore();

const { getContributorMergeActions } = useContributorStore();

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

const identityOrder = ['username', 'email'];

const identities = computed(() => (props.modelValue.identities || [])
  .sort((a, b) => {
    const aIndex = identityOrder.indexOf(a.type);
    const bIndex = identityOrder.indexOf(b.type);
    const aOrder = aIndex !== -1 ? aIndex : identityOrder.length;
    const bOrder = bIndex !== -1 ? bIndex : identityOrder.length;
    return aOrder - bOrder;
  }));

const fetchPreview = (identityId) => {
  if (fetchingPreview.value) {
    return;
  }

  selectedIdentity.value = identityId;
  fetchingPreview.value = true;

  MemberService.unmergePreview(props.modelValue?.id, identityId)
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

  trackEvent({
    key: FeatureEventKey.UNMERGE_MEMBER_IDENTITY,
    type: EventType.FEATURE,
    properties: {
      identity: selectedIdentity.value,
    },
  });

  unmerging.value = true;

  MemberService.unmerge(props.modelValue?.id, preview.value)
    .then(() => {
      getContributorMergeActions(props.modelValue?.id);
      Message.info(
        "We're finalizing profiles unmerging. We will let you know once the process is completed.",
        {
          title: 'Profiles unmerging in progress',
        },
      );
      getContributor(props.modelValue?.id)
        .then(() => {
          router.replace({
            params: {
              id: props.modelValue?.id,
            },
          });
        });
      emit('update:modelValue', null);
    })
    .catch((error) => {
      Message.error('There was an error unmerging profile');
    })
    .finally(() => {
      unmerging.value = false;
    });
};

onMounted(() => {
  if (props.selectedIdentity) {
    fetchPreview(props.selectedIdentity);
  }
});
</script>

<script>
export default {
  name: 'AppMemberUnmergeDialog',
};
</script>
