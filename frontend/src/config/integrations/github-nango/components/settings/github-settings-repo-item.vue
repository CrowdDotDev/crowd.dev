<template>
  <tr class="!border-0">
    <td class="!pb-2.5" :class="ri > 0 ? '!pt-2.5' : '!pt-5'">
      <div>
        <div class="flex items-center gap-1.5 mb-0.5">
          <lf-svg name="git-repository" class="w-4 h-4 text-gray-900" />
          <p class="text-small">
            {{ props.repository.name }}
          </p>
        </div>
      </div>
    </td>
    <td class="!py-2.5">
      <div class="flex items-center gap-3 w-full">
        <app-form-item
          :validation="$v.model"
          :error-messages="{
            required: 'This field is required',
          }"
          class="!mb-0 w-full"
          error-class="relative top-0"
        >
          <el-select
            v-model="model"
            placeholder="Select sub-project"
            class="w-full"
            placement="bottom-end"
            filterable
            @blur="$v.model.$touch"
            @change="$v.model.$touch"
          >
            <el-option
              v-for="subproject of props.subprojects"
              :key="subproject.id"
              :value="subproject.id"
              :label="subproject.name"
            />
          </el-select>
        </app-form-item>

        <lf-tooltip
          v-if="!props.orgSyncing"
          placement="top-end"
          content="Remove repository"
        >
          <lf-button type="secondary-ghost" icon-only @click="removeRepo()">
            <lf-icon name="circle-minus" type="regular" class="text-gray-500" />
          </lf-button>
        </lf-tooltip>
      </div>
    </td>
  </tr>
</template>

<script lang="ts" setup>
import { GitHubRepository } from '@/config/integrations/github-nango/types/GithubSettings';
import { computed, watch } from 'vue';
import LfSvg from '@/shared/svg/svg.vue';
import AppFormItem from '@/shared/form/form-item.vue';
import LfTooltip from '@/ui-kit/tooltip/Tooltip.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import useVuelidate from '@vuelidate/core';
import { required } from '@vuelidate/validators';
import { useRoute } from 'vue-router';

const props = defineProps<{
  repositories: GitHubRepository[];
  repository: GitHubRepository;
  subprojects: any[];
  modelValue: string;
  orgSyncing: boolean;
}>();

const emit = defineEmits<{(e: 'update:repositories', value: GitHubRepository[]): void;
  (e: 'update:modelValue', value: string): void;
  (e: 'remove-mapping', repoUrl: string): void;
}>();

const route = useRoute();

const repos = computed<GitHubRepository[]>({
  get: () => props.repositories,
  set: (value) => emit('update:repositories', value),
});

const model = computed<string>({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
});

const rules = {
  model: {
    required,
  },
};

const $v = useVuelidate(rules, {
  model,
});

const removeRepo = () => {
  repos.value = repos.value.filter((r) => r.url !== props.repository.url);
  emit('remove-mapping', props.repository.url);
};

watch(
  () => model.value,
  (value) => {
    if (!value) {
      const subproject = props.subprojects.find((sp) => sp.id === route.params.id);
      model.value = subproject ? subproject.id : props.subprojects[0]?.id;
    }
  },
  { immediate: true },
);
</script>

<script lang="ts">
export default {
  name: 'LfGithubSettingsRepoItem',
};
</script>
