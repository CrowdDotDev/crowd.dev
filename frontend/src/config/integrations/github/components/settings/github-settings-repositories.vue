<template>
  <div>
    <div class="flex justify-between pb-6">
      <lf-button type="primary-link" @click="emit('add')">
        <lf-icon name="plus" />
        Add repositories
      </lf-button>
      <lf-button type="secondary-link" @click="isBulkSelectOpened = true">
        <lf-icon name="list-check" />
        Bulk mapping
      </lf-button>
    </div>
    <div class="mb-3">
      <lf-search v-model="search" placeholder="Search repositories..." class="!h-9" />
    </div>
    <lf-table>
      <thead>
        <tr>
          <th>Repository</th>
          <th>Mapped with</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="(repo, ri) of repos" :key="repo.url" class="!border-0">
          <td class="!pb-2.5" :class="ri > 0 ? '!pt-2.5' : '!pt-5'">
            <div>
              <div class="flex items-center gap-1.5 mb-0.5">
                <lf-icon-old name="git-repository-line" :size="16" class="text-gray-900" />
                <p class="text-small font-semibold">
                  {{ repo.name }}
                </p>
              </div>
              <p class="text-tiny text-gray-500">
                {{ repo.owner }}
              </p>
            </div>
          </td>
          <td class="!py-2.5">
            <div class="flex items-center gap-3 w-full">
              <app-form-item
                :validation="$v[repo.url]"
                :error-messages="{
                  required: 'This field is required',
                }"
                class="!mb-0 w-full"
                error-class="relative top-0"
              >
                <el-select
                  v-model="repoMappings[repo.url]"
                  placeholder="Select sub-project"
                  class="w-full"
                  placement="bottom-end"
                  filterable
                  @blur="$v[repo.url].$touch"
                  @change="$v[repo.url].$touch"
                >
                  <el-option
                    v-for="subproject of props.subprojects"
                    :key="subproject.id"
                    :value="subproject.id"
                    :label="subproject.name"
                  />
                </el-select>
              </app-form-item>

              <lf-tooltip placement="top-end" content="Remove repository">
                <lf-button type="secondary-ghost" icon-only @click="removeRepo(repo)">
                  <lf-icon name="trash-can" />
                </lf-button>
              </lf-tooltip>
            </div>
          </td>
        </tr>
      </tbody>
    </lf-table>
  </div>
  <lf-github-settings-repositories-bulk-select
    v-model="isBulkSelectOpened"
    :repositories="repositories"
    :subprojects="subprojects"
    @apply="repoMappings = { ...repoMappings, ...$event }"
  />
</template>

<script lang="ts" setup>
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { computed, ref, watch } from 'vue';
import LfSearch from '@/ui-kit/search/Search.vue';
import LfTable from '@/ui-kit/table/Table.vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import AppFormItem from '@/shared/form/form-item.vue';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import LfGithubSettingsRepositoriesBulkSelect
  from '@/config/integrations/github/components/settings/github-settings-repositories-bulk-select.vue';

const props = defineProps<{
  repositories: any[];
  mappings: Record<string, string>;
  subprojects: any[];
}>();

const emit = defineEmits<{(e: 'update:repositories', value: any[]): void,
  (e: 'update:mappings', value: Record<string, string>): void,
  (e: 'add'): void }>();

const search = ref('');
const isBulkSelectOpened = ref(false);

const repos = computed<any[]>({
  get: () => props.repositories,
  set: (value) => emit('update:repositories', value),
});
const repoMappings = computed<Record<string, string>>({
  get: () => props.mappings,
  set: (value) => emit('update:mappings', value),
});

const rules = computed(() => repos.value.reduce((a: Record<string, any>, b: any) => ({
  ...a,
  [b.url]: {
    required,
  },
}), {}));

const $v = useVuelidate(rules, repoMappings);

const removeRepo = (repo: any) => {
  repos.value = repos.value.filter((r) => r.url !== repo.url);
};

watch(() => repos.value, (repoList) => {
  repoList.forEach((r) => {
    if (!repoMappings.value[r.url] && props.subprojects.length > 0) {
      repoMappings.value[r.url] = props.subprojects[0].id;
    }
  });
}, { deep: true });
</script>

<script lang="ts">
export default {
  name: 'LfGithubSettingsRepositories',
};
</script>
