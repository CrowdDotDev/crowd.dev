<template>
  <div class="pt-16">
    <div class="flex justify-center">
      <i
        class="ri-community-line text-gray-200 account-icon text-center h-16 flex items-center"
      />
    </div>
    <div class="text-gray-600 text-sm text-center py-4">
      Select the organization you want to merge with
    </div>
    <div class="flex justify-center">
      <div class="flex w-4/5">
        <app-autocomplete-one-input
          id="searchOrganizations"
          v-model="computedOrganizationToMerge"
          :fetch-fn="fetchFn"
          placeholder="Type to search organizations"
          input-class="w-full"
        >
          <template #option="{ item }">
            <div class="flex items-center">
              <app-avatar
                :entity="{
                  displayName: item.label,
                  avatar: item.logo,
                }"
                size="xxs"
                class="mr-3"
              />
              <div class="flex flex-col justify-center">
                <p class="text-xs leading-4.5" v-html="$sanitize(item.label)" />
              </div>
            </div>
          </template>
        </app-autocomplete-one-input>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed,
  ref,
  defineProps,
  defineEmits,
} from 'vue';
import AppAutocompleteOneInput from '@/shared/form/autocomplete-one-input.vue';
import AppAvatar from '@/shared/avatar/avatar.vue';
import { OrganizationService } from '@/modules/organization/organization-service';

const emit = defineEmits('update:modelValue');
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  id: {
    type: String,
    required: true,
  },
});
const loadingOrganizationToMerge = ref();
const computedOrganizationToMerge = computed({
  get() {
    return props.modelValue;
  },
  async set(value) {
    loadingOrganizationToMerge.value = true;

    const response = await OrganizationService.find(value.id);

    emit('update:modelValue', response);
    loadingOrganizationToMerge.value = false;
  },
});

const fetchFn = async (query, limit) => {
  const options = await OrganizationService.listAutocomplete(
    query,
    limit,
  );

  // Remove primary organization from organizations that can be merged with
  const filteredOptions = options.filter((m) => m.id !== props.id);

  // If the primary organization was removed, add an empty object in replacement
  if (options.length !== filteredOptions.length) {
    filteredOptions.push({});
  }

  return filteredOptions;
};
</script>

<script>
export default {
  name: 'AppOrganizationSelectionDropdown',
};
</script>

<style lang="scss" scoped>
.account-icon {
  font-size: 64px;
}
#searchOrganizations .el-select-dropdown__item {
  height: auto !important;
}
</style>
