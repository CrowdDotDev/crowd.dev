<template>
  <app-dialog v-model="isModalVisible" title="Bulk selection">
    <template #content>
      <div class="px-6">
        <article class="pb-3">
          <p class="text-sm font-medium text-black mb-1">
            Repositories
          </p>
          <el-select
            v-model="form.repositories"
            placeholder="Select option(s)"
            class="w-full"
            placement="bottom-end"
            filterable
            multiple
            :teleported="false"
          >
            <el-option
              v-for="repo of props.repositories"
              :key="repo.url"
              :value="repo.url"
              :label="repo.name"
            />
          </el-select>
        </article>
        <article class="pb-8">
          <p class="text-sm font-medium text-black mb-1">
            Map with
          </p>
          <el-select
            v-model="form.subproject"
            placeholder="Select sub-project"
            class="w-full"
            placement="bottom-end"
            filterable
            :teleported="false"
          >
            <el-option
              v-for="subproject of props.subprojects"
              :key="subproject.id"
              :value="subproject.id"
              :label="subproject.name"
            />
          </el-select>
        </article>
      </div>
      <div class="bg-gray-50 px-6 py-4 flex items-center justify-end gap-4">
        <el-button
          class="btn btn--md btn--bordered"
          @click="isModalVisible = false"
        >
          Cancel
        </el-button>
        <cr-button
          type="primary"
          :disabled="$v.$invalid"
          @click="mapRepos()"
        >
          Map repositories
        </cr-button>
      </div>
    </template>
  </app-dialog>
</template>

<script lang="ts" setup>
import {
  computed, reactive,
} from 'vue';
import AppDialog from '@/shared/dialog/dialog.vue';
import CrButton from '@/ui-kit/button/Button.vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: boolean,
  repositories: any[],
  subprojects: any[],
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void, (e: 'apply', value: Record<string, string>): void }>();

// Modal visibility
const isModalVisible = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});

const form = reactive({
  subproject: '',
  repositories: [],
});

const rules = {
  subproject: {
    required,
  },
  repositories: {
    required,
  },
};

const $v = useVuelidate(rules, form, { $stopPropagation: true });

const reset = () => {
  form.subproject = '';
  form.repositories = [];
  $v.value.$reset();
};

const mapRepos = () => {
  const data = form.repositories.reduce((mapping, url) => ({
    ...mapping,
    [url]: form.subproject,
  }), {});
  emit('apply', data);
  reset();
  isModalVisible.value = false;
};
</script>

<script lang="ts">
export default {
  name: 'AppGithubSettingsBulkSelect',
};
</script>
