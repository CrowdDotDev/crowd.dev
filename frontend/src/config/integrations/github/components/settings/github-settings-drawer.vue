<template>
  <lf-drawer v-model="isDrawerVisible">
    <div class="flex flex-col justify-between h-full">
      <section class="pt-4 px-6 pb-6 border-b border-gray-100">
        <div class="flex justify-between pb-3">
          <div>
            <p class="text-tiny text-gray-500 mb-1.5">
              Integration
            </p>
            <div class="flex items-center gap-2">
              <img src="/images/integrations/github.png" alt="GitHub" class="h-6 w-6" />
              <h5 class="text-black">
                GitHub
              </h5>
            </div>
          </div>
          <lf-button type="secondary-ghost" icon-only @click="isDrawerVisible = false">
            <lf-icon name="xmark" />
          </lf-button>
        </div>
        <p class="text-small text-gray-500">
          Sync GitHub repositories to track profile information and all relevant activities like commits, pull requests, discussions, and more.
        </p>
      </section>
      <div class="flex-grow">
        <lf-github-settings-empty
          v-if="repositories.length === 0"
          @add="isAddRepositoryModalOpen = true"
        />
        <div v-else class="px-6 pt-5">
          <lf-tabs v-model="tab" class="!w-full mb-6" :fragment="false">
            <lf-tab name="repositories" class="flex-grow">
              Synced repositories
            </lf-tab>
            <lf-tab name="organizations" class="flex-grow">
              Synced organizations
            </lf-tab>
          </lf-tabs>
          <lf-github-settings-repositories
            v-if="tab === 'repositories'"
            v-model:repositories="repositories"
            v-model:mappings="repoMappings"
            :subprojects="subprojects"
            @add="isAddRepositoryModalOpen = true"
          />
          <lf-github-settings-organizations
            v-else
            v-model:organizations="organizations"
          />
        </div>
      </div>
      <div class="border-t border-gray-100 py-5 px-6 flex justify-end gap-4" style="box-shadow: 0 -4px 4px 0 rgba(0, 0, 0, 0.05)">
        <lf-button type="secondary-ghost-light" @click="isDrawerVisible = false">
          Cancel
        </lf-button>
        <lf-button
          type="primary"
          :disabled="$v.$invalid || !repositories.length"
          @click="connect()"
        >
          Connect
        </lf-button>
      </div>
    </div>
  </lf-drawer>
  <lf-github-settings-add-repository-modal
    v-if="isAddRepositoryModalOpen"
    v-model="isAddRepositoryModalOpen"
    v-model:organizations="organizations"
    v-model:repositories="repositories"
    :integration="props.integration"
  />
</template>

<script lang="ts" setup>
import {
  computed, onMounted, ref,
} from 'vue';
import LfDrawer from '@/ui-kit/drawer/Drawer.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfGithubSettingsEmpty from '@/config/integrations/github/components/settings/github-settings-empty.vue';
import LfGithubSettingsAddRepositoryModal
  from '@/config/integrations/github/components/settings/github-settings-add-repository-modal.vue';
import LfTabs from '@/ui-kit/tabs/Tabs.vue';
import LfTab from '@/ui-kit/tabs/Tab.vue';
import LfGithubSettingsRepositories
  from '@/config/integrations/github/components/settings/github-settings-repositories.vue';
import LfGithubSettingsOrganizations
  from '@/config/integrations/github/components/settings/github-settings-organizations.vue';
import { LfService } from '@/modules/lf/segments/lf-segments-service';
import { useRoute } from 'vue-router';
import useVuelidate from '@vuelidate/core';

const props = defineProps<{
  modelValue: boolean,
  integration: any
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void }>();

const route = useRoute();

const isAddRepositoryModalOpen = ref(false);

const tab = ref('repositories');
const subprojects = ref([]);
const organizations = ref([]);
const repositories = ref([]);
const repoMappings = ref<Record<string, string>>({});

// Drawer visibility
const isDrawerVisible = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});

const fetchSubProjects = () => {
  LfService.findSegment(route.params.grandparentId)
    .then((segment) => {
      subprojects.value = segment.projects.map((p) => p.subprojects).flat();
    });
};

const $v = useVuelidate();

const connect = () => {
  // TODO: Update settings
};

onMounted(() => {
  fetchSubProjects();
});
</script>

<script lang="ts">
export default {
  name: 'LfGithubSettingsDrawer',
};
</script>
