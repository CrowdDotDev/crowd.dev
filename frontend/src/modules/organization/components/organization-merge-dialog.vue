<template>
  <app-dialog
    v-if="isModalOpen"
    v-model="isModalOpen"
    title="Merge organization"
    size="2extra-large"
  >
    <template #content>
      <div class="p-6 relative border-t">
        <div class="flex -mx-3">
          <div class="w-1/2 px-3">
            <app-organization-merge-suggestions-details
              v-if="props.modelValue"
              :organization="props.modelValue"
              :compare-organization="organizationToMerge"
              :is-primary="originalOrganizationPrimary"
              @make-primary="originalOrganizationPrimary = true"
            />
          </div>
          <div class="w-1/2 px-3">
            <app-organization-selection-dropdown
              v-if="organizationToMerge === null"
              :id="props.modelValue?.id"
              v-model="organizationToMerge"
              style="margin-right: 5px"
            />
            <app-organization-merge-suggestions-details
              v-else
              :organization="organizationToMerge"
              :compare-organization="props.modelValue"
              :is-primary="!originalOrganizationPrimary"
              @make-primary="originalOrganizationPrimary = false"
            >
              <template #action>
                <button
                  class="btn btn--transparent btn--sm leading-5 !px-4 !py-1"
                  type="button"
                  @click="changeOrganization()"
                >
                  <span class="ri-refresh-line text-base text-brand-500 mr-2" />
                  <span class="text-brand-500">Change organization</span>
                </button>
              </template>
            </app-organization-merge-suggestions-details>
          </div>
        </div>
        <div class="pt-6 flex justify-end">
          <el-button class="btn btn--bordered btn--lg mr-4" @click="emit('update:modelValue', null)">
            Cancel
          </el-button>
          <el-button
            class="btn btn--primary btn--lg"
            :disabled="!organizationToMerge"
            :loading="sendingMerge"
            @click="mergeSuggestion()"
          >
            Merge organizations
          </el-button>
        </div>
      </div>
    </template>
  </app-dialog>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Message from '@/shared/message/message';
import AppDialog from '@/shared/dialog/dialog.vue';
import AppOrganizationMergeSuggestionsDetails
  from '@/modules/organization/components/suggestions/organization-merge-suggestions-details.vue';
import { useOrganizationStore } from '@/modules/organization/store/pinia';
import { OrganizationService } from '@/modules/organization/organization-service';
import AppOrganizationSelectionDropdown from '@/modules/organization/components/organization-selection-dropdown.vue';
import { storeToRefs } from 'pinia';

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['update:modelValue']);

const route = useRoute();
const router = useRouter();

const organizationStore = useOrganizationStore();
const {
  mergedOrganizations,
} = storeToRefs(organizationStore);

const originalOrganizationPrimary = ref(true);
const sendingMerge = ref(false);

const organizationToMerge = ref(null);

const isModalOpen = computed({
  get() {
    return props.modelValue !== null;
  },
  set() {
    emit('update:modelValue', null);
    organizationToMerge.value = null;
  },
});

const changeOrganization = () => {
  organizationToMerge.value = null;
  originalOrganizationPrimary.value = true;
};

const mergeSuggestion = () => {
  if (sendingMerge.value) {
    return;
  }

  sendingMerge.value = true;

  OrganizationService.mergeOrganizations(
    originalOrganizationPrimary.value ? props.modelValue?.id : organizationToMerge.value?.id,
    originalOrganizationPrimary.value ? organizationToMerge.value?.id : props.modelValue?.id,
  )
    .then(() => {
      const primaryOrganization = originalOrganizationPrimary.value ? props.modelValue : organizationToMerge.value;
      const secondaryOrganization = originalOrganizationPrimary.value ? organizationToMerge.value : props.modelValue;

      organizationStore
        .addMergedOrganizations(primaryOrganization.id, secondaryOrganization.id);

      const processesRunning = Object.keys(mergedOrganizations.value).length;

      Message.closeAll();
      Message.info(null, {
        title: 'Organizations merging in progress',
        message: processesRunning > 1 ? `${processesRunning} processes running` : null,
      });

      emit('update:modelValue', null);

      if (route.name === 'organizationView') {
        const { id } = originalOrganizationPrimary.value ? props.modelValue : organizationToMerge.value;

        organizationStore.fetchOrganization(id).then(() => {
          router.replace({
            params: {
              id,
            },
          });
        });
      } else if (route.name === 'organization') {
        organizationStore.fetchOrganizations({ reload: true });
      }

      changeOrganization();
    })
    .catch(() => {
      Message.closeAll();
      Message.error('There was an error merging organizations');
    })
    .finally(() => {
      sendingMerge.value = false;
    });
};

</script>

<script>
export default {
  name: 'AppOrganizationMergeDialog',
};
</script>
