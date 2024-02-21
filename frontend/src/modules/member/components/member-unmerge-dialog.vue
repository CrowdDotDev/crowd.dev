<template>
  <app-dialog
    v-if="isModalOpen"
    v-model="isModalOpen"
    title="Unmerge identity"
    size="2extra-large"
    custom-class="p-0"
  >
    <template #header>
      <h3 class="text-lg font-semibold">Unmerge identity</h3>
    </template>
    <template #headerActions>
      <div class="flex justify-end -my-1">
        <el-button class="btn btn--bordered btn--md mr-4" @click="emit('update:modelValue', null)">
          Cancel
        </el-button>
        <el-button
            class="btn btn--primary btn--md"
            :disabled="!selectedIdentity || !preview"
            @click="unmerge()"
            :loading="unmerging"
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
              :compare-member="preview"
              :is-primary="true"
            >
             <template #header>
               <div class="h-13 flex justify-between items-start">
                 <div
                     class="bg-brand-500 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium"
                 >
                   Current contact
                 </div>
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
                     class="bg-brand-500 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium"
                 >
                   Updated contact
                 </div>
               </div>
             </template>
            </app-member-suggestions-details>
          </div>
          <div class="w-1/2 px-3">
            <!-- Loading preview -->
            <div class="flex items-center justify-center h-full w-full" v-if="fetchingPreview">
              <cr-spinner />
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
                        <i class="ri-link-unlink-m mr-1" />Unmerged contributor
                      </div>
                      <el-dropdown
                          placement="bottom-end"
                          trigger="click"
                      >
                        <button
                            class="btn btn--link"
                            type="button"
                            @click.stop
                        >
                          Change identity
                        </button>
                        <template #dropdown>
                          <template v-for="i of identities"
                                    :key="`${i.platform}:${i.username}`">
                            <el-dropdown-item
                                v-if="`${i.platform}:${i.username}` !== selectedIdentity"
                                :value="`${i.platform}:${i.username}`"
                                :label="i.username"
                                @click="fetchPreview(`${i.platform}:${i.username}`)"
                            >
                              <img class="h-5 w-5 mr-2"
                                   v-if="platformDetails(i.platform)" :alt="platformDetails(i.platform)?.name" :src="platformDetails(i.platform)?.image" />
                              <span>{{i.username}}</span>
                            </el-dropdown-item>
                          </template>

                        </template>
                      </el-dropdown>
                    </div>
                  </div>

                </template>
              </app-member-suggestions-details>
            </div>
            <!-- Identity selection -->
            <div v-else class="pt-14">
              <div class="flex justify-center pb-5">
                <div class="ri-fingerprint-line text-5xl text-gray-200" />
              </div>
              <p class="text-center text-xs leading-5 text-gray-500">
                Select the contributor identity you want to unmerge
              </p>
              <div class="pt-4">
                <el-select
                    placeholder="Select identity"
                    class="w-full"
                    @update:modelValue="fetchPreview($event)"
                >
                  <el-option
                      v-for="i of identities"
                      :key="`${i.platform}:${i.username}`"
                      :value="`${i.platform}:${i.username}`"
                      :label="i.username"
                  >
                    <img class="h-5 w-5 mr-2"
                        v-if="platformDetails(i.platform)" :alt="platformDetails(i.platform)?.name" :src="platformDetails(i.platform)?.image" />
                    {{i.username}}
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
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { MemberService } from '@/modules/member/member-service';
import Message from '@/shared/message/message';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { useMemberStore } from '@/modules/member/store/pinia';
import AppMemberSelectionDropdown from './member-selection-dropdown.vue';
import AppMemberSuggestionsDetails from './suggestions/member-merge-suggestions-details.vue';
import AppDialog from '@/shared/dialog/dialog.vue';
import CrSpinner from '@/ui-kit/spinner/Spinner.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);


const unmerging = ref(false);
const fetchingPreview = ref(false);
const preview = ref(null);
const selectedIdentity = ref(null)

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
  if(!props.modelValue?.username){
    return [];
  }
  return Object.entries(props.modelValue.username).reduce((arr, [platform, idents]) => {
    return [...arr, ...idents.map((i) => ({username: i, platform}))];
  }, [])
})

const platformDetails = (platform) => {
  return CrowdIntegrations.getConfig(platform);
}


const fetchPreview = (identity) => {
  if (fetchingPreview.value) {
    return;
  }

  selectedIdentity.value=identity;
  fetchingPreview.value = true;

  const [platform, username] = identity.split(':');
  MemberService.unmergePreview( props.modelValue?.id, platform, username)
    .then((res) => {
      preview.value = res
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

  MemberService.unmerge(props.modelValue?.id, preview.value)
      .then(() => {
        Message.info(
            "We’re syncing all activities of the unmerged contributor. We will let you know once the process is completed.",
            {
              title: 'Contributors unmerging in progress',
            },
        );
        emit('update:modelValue', null);
      })
      .catch((error) => {
          Message.error('There was an error unmerging contact');
      })
      .finally(() => {
        unmerging.value = false;
      });
};

</script>

<script>
export default {
  name: 'AppMemberUnmergeDialog',
};
</script>
