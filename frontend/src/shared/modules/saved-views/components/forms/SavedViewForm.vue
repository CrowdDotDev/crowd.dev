<template>
  <app-drawer v-model="isDrawerOpen" :title="title" size="600px">
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
              <el-switch v-model="form.shared" :disabled="isEdit" />
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
            <el-dropdown placement="bottom-start" trigger="click" popper-class="!p-0">
              <p class="text-xs font-medium leading-5 text-brand-500">
                + Add filter
              </p>
              <template #dropdown>
                <div class="-m-2">
                  <div class="border-b border-gray-100 p-2">
                    <el-input
                      ref="queryInput"
                      v-model="dropdownSearch"
                      placeholder="Search..."
                      class="filter-dropdown-search"
                      data-qa="filter-list-search"
                    >
                      <template #prefix>
                        <i class="ri-search-line" />
                      </template>
                    </el-input>
                  </div>
                  <div class="m-2">
                    <el-dropdown-item
                      v-for="[key, filterConfig] of filteredFilters"
                      :key="key"
                      :disabled="filterList.includes(key)"
                      @click="addFilter(key)"
                    >
                      {{ filterConfig.label }}
                    </el-dropdown-item>
                  </div>
                </div>
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
          <div class="flex items-center">
            <div class="w-2/3">
              <el-select v-model="form.sorting.prop" class="w-full sort-property-select">
                <el-option
                  v-for="(label, key) in props.config.sorting"
                  :key="key"
                  :value="key"
                  :label="label"
                />
              </el-select>
            </div>
            <div class="w-1/3 -ml-px">
              <el-select v-model="form.sorting.order" class="w-full sort-order-select">
                <el-option value="ascending" label="Ascending" />
                <el-option value="descending" label="Descending" />
              </el-select>
            </div>
          </div>
        </section>
      </div>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button
          class="btn btn--md btn--bordered mr-3"
          @click="isDrawerOpen = false"
        >
          Cancel
        </el-button>
        <el-button
          type="primary"
          class="btn btn--md btn--primary"
          :loading="sending"
          :disabled="$v.$invalid"
          @click="submit()"
        >
          {{ isEdit ? 'Update' : 'Add view' }}
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script setup lang="ts">
import {
  computed, reactive, ref, watch,
} from 'vue';
import AppDrawer from '@/shared/drawer/drawer.vue';
import AppFormItem from '@/shared/form/form-item.vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import { SavedView, SavedViewCreate, SavedViewsConfig } from '@/shared/modules/saved-views/types/SavedViewsConfig';
import { FilterConfig } from '@/shared/modules/filters/types/FilterConfig';
import CrFilterItem from '@/shared/modules/filters/components/FilterItem.vue';
import { SavedViewsService } from '@/shared/modules/saved-views/services/saved-views.service';
import Message from '@/shared/message/message';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';

const props = defineProps<{
  modelValue: boolean,
  config: SavedViewsConfig,
  filters: Record<string, FilterConfig>,
  placement: string,
  view: SavedView | SavedViewCreate | null,
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): any,
  (e: 'reload'): any
}>();

const isEdit = computed(() => props.view && (props.view as SavedView).id);
const isDuplicate = computed(() => props.view && !(props.view as SavedView).id);

const title = computed<string>(() => {
  if (isEdit.value) {
    return 'Edit view';
  }
  if (isDuplicate.value) {
    return 'Duplicate view';
  }
  return 'New view';
});

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

interface SavedViewForm {
  shared: boolean;
  name: string;
  relation: 'and' | 'or';
  filters: Record<string, any>;
  settings: Record<string, any>;
  sorting: {
    prop: string;
    order: 'descending' | 'ascending';
  }
}

const form = reactive<SavedViewForm>({
  shared: false,
  name: '',
  relation: 'and',
  filters: {},
  settings: { ...settingsDefaultValue.value },
  sorting: {
    prop: props.config.defaultView.config.order.prop,
    order: props.config.defaultView.config.order.order,
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

// Filter dropdown
const dropdownSearch = ref<string>('');

const filteredFilters = computed(() => Object.entries(props.filters)
  .filter(([_, config]: [string, FilterConfig]) => config.label.toLowerCase().includes(dropdownSearch.value.toLowerCase())));

// Filter list management
const filterList = ref<string[]>([]);
const openedFilter = ref<string>('');

const addFilter = (key: string) => {
  if (filterList.value.includes(key)) {
    return;
  }
  filterList.value.push(key);
  openedFilter.value = key;
  dropdownSearch.value = '';
};

const removeFilter = (key: any) => {
  openedFilter.value = '';
  filterList.value = filterList.value.filter((el) => el !== key);
  delete form.filters[key];
  dropdownSearch.value = '';
};

const fillForm = () => {
  if (props.view) {
    form.shared = props.view.visibility === 'tenant';
    form.name = props.view.name;
    const {
      relation, order, settings, search, ...restFilters
    } = props.view.config;
    form.relation = relation;
    form.sorting.prop = order.prop;
    form.sorting.order = order.order;
    form.filters = restFilters || {};
    form.settings = settings || {};
    filterList.value = Object.keys(restFilters);
    console.log(restFilters);
  }
};

const reset = () => {
  form.shared = false;
  form.name = '';
  form.relation = 'and';
  form.filters = {};
  form.settings = { ...settingsDefaultValue.value };
  form.sorting = {
    prop: props.config.defaultView.config.order.prop,
    order: props.config.defaultView.config.order.order,
  };
  $v.value.$reset();
};

watch(() => props.view, () => {
  reset();
  if (props.view) {
    fillForm();
  }
}, { deep: true, immediate: true });

// Form submission
const sending = ref<boolean>(false);

const submit = (): void => {
  if ($v.value.$invalid) {
    return;
  }
  sending.value = true;
  const data: SavedViewCreate = {
    name: form.name,
    config: {
      search: '',
      relation: 'and',
      order: {
        prop: form.sorting.prop,
        order: form.sorting.order,
      },
      settings: form.settings,
      ...form.filters,
    },
    placement: props.placement,
    visibility: form.shared ? 'tenant' : 'user',
  };
  if (isEdit.value) {
    (form.shared ? ConfirmDialog({
      type: 'danger',
      title: 'Update shared view',
      message:
          'This view is shared with all workspace users, any changes will reflected in each user account.',
      icon: 'ri-loop-left-line',
      cancelButtonText: 'Cancel',
      confirmButtonText: 'Update shared view',
    } as any) : Promise.resolve())
      .then(() => {
        SavedViewsService.update((props.view as SavedView).id, data)
          .then(() => {
            isDrawerOpen.value = false;
            reset();
            Message.success('View updated successfully!');
            emit('reload');
          })
          .catch(() => {
            Message.error('There was an error updating a view');
          })
          .finally(() => {
            sending.value = false;
          });
      });
  } else {
    SavedViewsService.create(data)
      .then(() => {
        isDrawerOpen.value = false;
        reset();
        if (isDuplicate.value) {
          Message.success('View duplicated successfully!');
        } else {
          Message.success('View successfully created!');
        }
        emit('reload');
      })
      .catch(() => {
        if (isDuplicate.value) {
          Message.error('There was an error duplicating a view');
        } else {
          Message.error('There was an error creating a view');
        }
      })
      .finally(() => {
        sending.value = false;
      });
  }
};
</script>

<script lang="ts">
export default {
  name: 'CrSavedViewsForm',
};
</script>

<style lang="scss">
.sort-property-select{
  .el-input .el-input__wrapper, .el-input .el-textarea__inner{
    @apply rounded-r-none;
  }
}
.sort-order-select{
  .el-input .el-input__wrapper, .el-input .el-textarea__inner{
    @apply rounded-l-none;
  }
}
</style>
