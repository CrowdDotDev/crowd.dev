<template>
  <app-drawer v-model="isDrawerOpen" title="New view" size="600px">
    <template #content>
      <div class="-mx-6 -mt-4">
        <!-- Share with workspace -->
        <section class="border-y border-gray-200 bg-gray-50 py-4 px-6">
          <div class="flex justify-between items-center">
            <div>
              <h6 class="text-sm font-medium leading-5">
                Shared with workspace
              </h6>
              <p class="text-2xs leading-4.5 text-gray-500">
                If enabled, the view will be shared with all users from this workspace.
              </p>
            </div>
            <div>
              <el-switch />
            </div>
          </div>
        </section>

        <!-- Name and setting -->
        <section class="p-6">
          <app-form-item
            :validation="$v.name"
            :error-messages="{
              required: 'This field is required',
            }"
            label="View name"
            :required="true"
            class="mb-0"
          >
            <el-input
              v-model="form.name"
              @blur="$v.name.$touch"
              @change="$v.name.$touch"
            />
          </app-form-item>
        </section>

        <!-- Settings -->
        <section v-if="Object.keys(settings).length > 0" class="px-6">
          <div class="border-b border-gray-200 pb-1">
            <div v-for="(setting, settingsKey) in settings" :key="settingsKey" class="pb-3">
              <component :is="setting.settingsComponent" v-model="form.settings[settingsKey]" />
            </div>
          </div>
        </section>

        <!-- Filters -->
        <section class="px-6">
          <div class="py-6">
            <h6 class="text-base font-semibold">
              Filters
            </h6>
          </div>
          <div>
            <div v-for="filter of filterList" :key="filter" class="flex items-center mb-3">
              <cr-filter-item
                v-model="form.filters[filter]"
                v-model:open="openedFilter"
                :config="props.filters[filter]"
                :hide-remove="true"
                class="flex-grow"
                chip-classes="w-full !h-10"
              />
              <div
                class="ml-2 h-10 w-10 flex items-center justify-center cursor-pointer"
                @click="removeFilter(filter)"
              >
                <i class="ri-delete-bin-line text-lg h-5 flex items-center" />
              </div>
            </div>
          </div>
          <div
            class="flex pb-10 border-b border-gray-200 pt-1"
          >
            <el-dropdown placement="bottom-start" trigger="click">
              <p class="text-xs font-medium leading-5 text-brand-500">
                + Add filter
              </p>
              <template #dropdown>
                <el-dropdown-item
                  v-for="(filterConfig, key) in props.filters"
                  :key="key"
                  :disabled="filterList.includes(key)"
                  @click="addFilter(key)"
                >
                  {{ filterConfig.label }}
                </el-dropdown-item>
              </template>
            </el-dropdown>
          </div>
        </section>

        <!-- Filters -->
        <section class="px-6">
          <div class="py-6">
            <h6 class="text-base font-semibold">
              Sorting
            </h6>
          </div>
          <div />
        </section>
      </div>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">
import {
  computed, reactive, ref,
} from 'vue';
import AppDrawer from '@/shared/drawer/drawer.vue';
import AppFormItem from '@/shared/form/form-item.vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import { SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import CrFilterItem from '@/shared/modules/filters/components/FilterItem.vue';

const props = defineProps<{
  modelValue: boolean,
  config: SavedViewsConfig,
  filters: Record<string, FilterConfig>
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): any}>();

const isDrawerOpen = computed<boolean>({
  get() {
    return props.modelValue;
  },
  set(value: boolean) {
    emit('update:modelValue', value);
  },
});

const settingsDefaultValue = computed<Record<string, any>>(() => {
  const settingsObject = { ...props.config.settings };
  Object.entries(settingsObject).forEach(([key, setting]) => {
    if (setting.inSettings && setting.settingsComponent) {
      settingsObject[key] = settingsObject[key].defaultValue;
    } else {
      delete settingsObject[key];
    }
  });
  return settingsObject;
});

const form = reactive({
  shared: false,
  name: '',
  filters: {},
  settings: { ...settingsDefaultValue.value },
  sorting: {
    property: '',
    direction: 'asc',
  },
});

const rules = {
  name: {
    required,
  },
};

const $v = useVuelidate(rules, form);

const settings = computed<Record<string, any>>(() => {
  const settingsObject = { ...props.config.settings };
  Object.entries(settingsObject).forEach(([key, setting]) => {
    if (!setting.inSettings || !setting.settingsComponent) {
      delete settingsObject[key];
    }
  });
  return settingsObject;
});

const filterList = ref<string[]>([]);
const openedFilter = ref<string>('');

const addFilter = (key: string) => {
  if (filterList.value.includes(key)) {
    return;
  }
  filterList.value.push(key);
  openedFilter.value = key;
};

const removeFilter = (key: any) => {
  openedFilter.value = '';
  filterList.value = filterList.value.filter((el) => el !== key);
  delete form.filters[key];
};
</script>

<script lang="ts">
export default {
  name: 'CrSavedViewsForm',
};
</script>
