<template>
  <div class="flex flex-col">
    <div
      v-for="(repository, index) of cForm.repositories"
      :key="repository.url"
      class="flex items-center py-4"
      :class="{
        'border-b border-gray-100': index !== cForm.repositories.length - 1,
        'pt-0': index === 0,
        'opacity-40': !repository.enabled,
      }"
    >
      <div class="flex items-center w-3/5">
        <lf-svg
          name="git-repository"
          class="!block w-5 h-5 text-gray-900 mr-3"
        />
        <span class="text-gray-900 text-sm">{{ repository.url }}</span>
      </div>
      <div
        class="flex items-center gap-2 border border-gray-200 rounded-[100px] px-2 ml-3"
      >
        <template v-for="platform of repository.platforms" :key="platform">
          <lf-icon
            v-if="platform === 'github'"
            name="github"
            :size="25"
            class="text-[#24292F]"
            type="brands"
          />
          <lf-icon
            v-if="platform === 'git'"
            name="git-alt"
            :size="25"
            class="text-[#F05133]"
            type="brands"
          />
          <lf-svg
            v-if="platform === 'gitlab'"
            name="gitlab"
            class="!block w-4 h-4"
          />
          <img
            v-if="platform === 'gerrit'"
            src="/src/assets/images/integrations/gerrit.png"
            alt="Gerrit"
            class="w-5 h-5"
          />
        </template>
      </div>
      <lf-switch v-model="repository.enabled" class="ml-auto" :size="'small'" />
    </div>
    <div
      v-if="cForm.repositories.length === 0"
      class="flex items-center justify-center pt-14"
    >
      <span class="text-gray-500 text-sm">
        There are no repositories connected to this project
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import LfSvg from '@/shared/svg/svg.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfSwitch from '@/ui-kit/switch/Switch.vue';
import { reactive } from 'vue';
import { InsightsProjectAddFormModel } from '../models/insights-project-add-form.model';

const props = defineProps<{
  form: InsightsProjectAddFormModel;
}>();

const cForm = reactive(props.form);
</script>

<script lang="ts">
export default {
  name: 'LfInsightsProjectAddRepositoriesTab',
};
</script>
