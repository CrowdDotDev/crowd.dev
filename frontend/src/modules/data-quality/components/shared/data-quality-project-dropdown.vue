<template>
  <lf-dropdown>
    <template #trigger>
      <lf-button type="secondary">
        <lf-icon-old name="stack-line" />
        <div class="truncate" style="max-width: 28ch;">
          {{ getSegmentName(projectGroup) || 'Select project group' }}
        </div>
      </lf-button>
    </template>
    <div class="-mx-2 -mt-2 mb-2 min-w-64" @click.stop>
      <lf-input
        v-model="search"
        placeholder="Search..."
        class=" !border-0 !rounded-none shadow-none"
      >
        <template #prefix>
          <lf-icon-old name="search-line" />
        </template>
      </lf-input>
    </div>

    <div class="w-full max-h-60 overflow-auto">
      <lf-dropdown-item
        v-for="group of options"
        :key="group.id"
        :selected="projectGroup === group.id"
        @click="changeOption(group.id)"
      >
        {{ group.name }}
      </lf-dropdown-item>
      <div v-if="options.length === 0" class="text-gray-400 px-3 h-16 flex items-center justify-center">
        <span class="text-tiny text-gray-400"> No project groups found </span>
      </div>
    </div>
  </lf-dropdown>
</template>

<script lang="ts" setup>
import LfButton from '@/ui-kit/button/Button.vue';
import { computed, ref } from 'vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import LfDropdown from '@/ui-kit/dropdown/Dropdown.vue';
import LfDropdownItem from '@/ui-kit/dropdown/DropdownItem.vue';
import { storeToRefs } from 'pinia';
import { useLfSegmentsStore } from '@/modules/lf/segments/store';
import { getSegmentName } from '@/utils/segments';
import LfInput from '@/ui-kit/input/Input.vue';
import { useRoute, useRouter } from 'vue-router';

const props = defineProps<{
  modelValue: string;
}>();

const router = useRouter();
const route = useRoute();

const emit = defineEmits<{(e: 'update:modelValue', value: string): void}>();

const { projectGroups } = storeToRefs(useLfSegmentsStore());

const search = ref('');

const projectGroup = computed({
  get: () => props.modelValue,
  set: (value: string) => emit('update:modelValue', value),
});

const options = computed(() => projectGroups.value.list.filter((group) => group.name.toLowerCase().includes(search.value.toLowerCase())));

const changeOption = (group: string) => {
  projectGroup.value = group;
  search.value = '';
  router.push({
    ...route,
    query: {
      ...route.query,
      projectGroup: group,
    },
  });
};
</script>

<script lang="ts">
export default {
  name: 'LfDataQualityProjectDropdown',
};
</script>
