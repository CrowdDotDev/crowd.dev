<template>
  <app-autocomplete-one-input
    v-model="form"
    :fetch-fn="fetchOrganizations"
    :create-fn="createOrganization"
    placeholder="Select  organization"
    input-class="organization-input"
    :create-if-not-found="true"
    :in-memory-filter="false"
    :clearable="false"
    class="w-full"
    :teleported="false"
  >
    <template v-if="form && (form.displayName || form.name)" #prefix>
      <div class="flex items-center">
        <lf-avatar
          :name="form.displayName || form.name"
          :src="form.logo"
          :size="20"
          class="!rounded-sm"
        >
          <template #placeholder>
            <div class="w-full h-full bg-gray-50 flex items-center justify-center">
              <lf-icon-old name="community-line" :size="12" class="text-gray-400" />
            </div>
          </template>
        </lf-avatar>
      </div>
    </template>
    <template #option="{ item }">
      <div class="flex w-full items-center justify-between gap-2 flex-wrap">
        <div class="flex items-center">
          <lf-avatar
            :name="item.displayName"
            :src="item.logo"
            :size="20"
            class="mr-2 !rounded-sm"
          >
            <template #placeholder>
              <div class="w-full h-full bg-gray-50 flex items-center justify-center">
                <lf-icon-old name="community-line" :size="12" class="text-gray-400" />
              </div>
            </template>
          </lf-avatar>
          {{ item.displayName || item.name }}
        </div>

        <lf-project-groups-tags :segments="item.segments" />
      </div>
    </template>
  </app-autocomplete-one-input>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { OrganizationService } from '@/modules/organization/organization-service';
import { Organization } from '@/modules/organization/types/Organization';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import LfProjectGroupsTags from '@/shared/modules/project-groups/components/project-groups-tags.vue';
import AppAutocompleteOneInput from '@/shared/form/autocomplete-one-input.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';

const props = defineProps<{
  modelValue: Organization | null,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: Organization | null): any}>();

const { selectedProjectGroup } = storeToRefs(useLfSegmentsStore());

const form = computed<Organization | null>({
  get() {
    return props.modelValue;
  },
  set(value: Organization | null) {
    emit('update:modelValue', value);
  },
});

const fetchOrganizations = async ({ query } : {
  query: string,
}) => OrganizationService.listOrganizationsAutocomplete({
  query,
  limit: 40,
  excludeSegments: true,
  segments: [selectedProjectGroup.value?.id],
});

const createOrganization = (value: string) => OrganizationService.create({
  name: value,
  attributes: {
    name: {
      default: value,
      custom: [value],
    },
  },
})
  .then((newOrganization) => ({
    id: newOrganization.id,
    label: newOrganization.displayName || newOrganization.name,
    displayName: newOrganization.displayName || newOrganization.name,
    name: newOrganization.displayName || newOrganization.name,
  }))
  .catch(() => null);

onMounted(() => {
  fetchOrganizations({ query: '' });
});
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationSelect',
};
</script>
