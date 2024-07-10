<template>
  <el-select
    v-model="form"
    filterable
    remote
    reserve-keyword
    placeholder="Select organization"
    :remote-method="fetchOrganizations"
    :loading="loading"
    v-bind="$attrs"
  >
    <template v-if="form" #prefix>
      <lf-avatar
        v-if="form"
        :name="form?.displayName"
        :src="form?.logo"
        :size="20"
      />
    </template>
    <el-option
      v-if="form"
      :key="form.id"
      :label="form.displayName"
      :value="form"
      class="!px-3"
    >
      <lf-avatar :name="form.displayName" :src="form.logo" :size="20" class="mr-2" />
      <span>{{ form.displayName }}</span>
    </el-option>
    <el-option
      v-for="org in organizatons"
      :key="org.id"
      :label="org.displayName"
      :value="org"
      class="!px-3"
    >
      <lf-avatar :name="org.displayName" :src="org.logo" :size="20" class="mr-2" />
      <span>{{ org.displayName }}</span>
    </el-option>
  </el-select>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { OrganizationService } from '@/modules/organization/organization-service';
import { Organization } from '@/modules/organization/types/Organization';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';

const props = defineProps<{
  modelValue: Organization | null,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: Organization | null): any}>();

const form = computed<Organization | null>({
  get() {
    return props.modelValue;
  },
  set(value: Organization | null) {
    emit('update:modelValue', value);
  },
});

const loading = ref<boolean>(false);
const organizatons = ref<Organization[]>([]);

const fetchOrganizations = (query: string) => {
  OrganizationService.listOrganizationsAutocomplete({
    query,
    limit: 40,
    excludeSegments: true,
  })
    .then((options: Organization[]) => {
      organizatons.value = options.filter((m) => m.id !== props.modelValue?.id);
    })
    .finally(() => {
      loading.value = false;
    });
};

onMounted(() => {
  fetchOrganizations('');
});
</script>

<script lang="ts">
export default {
  name: 'LfOrganizationSelect',
};
</script>
