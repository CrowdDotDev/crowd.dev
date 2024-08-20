<template>
  <app-drawer
    v-model="isDrawerVisible"
    title="GitLab"
    size="600px"
    pre-title="Integration"
    :show-footer="true"
    has-border
    @close="isDrawerVisible = false"
  >
    <template #beforeTitle>
      <img :src="gitlabDetails.image" class="w-6 h-6 mr-2" alt="GitLab logo" />
    </template>
    <template #content>
      <div>
        <!-- Connected user info -->
        <section
          v-if="connectedUser"
          class="border border-gray-200 rounded-md py-4 px-5 mb-6"
        >
          <p class="text-2xs font-medium text-gray-400 mb-1">
            Connected user
          </p>
          <div class="flex items-center">
            <div
              v-if="connectedUser.avatar_url"
              class="h-5 w-5 rounded border border-gray-200 mr-2"
            >
              <img :src="connectedUser.avatar_url" class="object-cover" :alt="connectedUser.name" />
            </div>
            <p class="text-xs font-medium leading-5">
              {{ connectedUser.name }} ({{ connectedUser.username }})
            </p>
          </div>
        </section>

        <!-- Connected groups -->
        <section v-if="connectedGroups.length > 0" class="mb-6">
          <h6 class="text-sm font-medium leading-5 mb-2">
            Connected Groups
          </h6>
          <ul class="list-disc list-inside">
            <li v-for="group in connectedGroups" :key="group.id" class="text-xs">
              {{ group.name }}
              <span v-if="!groupHasProjects(group)" class="text-gray-400">(No projects in this group)</span>
            </li>
          </ul>
        </section>

        <!-- Disclaimer -->
        <section class="pb-4">
          <div class="pb-4">
            <h6 class="text-sm font-medium leading-5 mb-2">
              Repository mapping
            </h6>
            <p class="text-2xs leading-4.5 text-gray-500">
              Select the subproject you want to map with each connected repository, or choose to ignore it from sync.
            </p>
          </div>
          <div
            class="border border-yellow-100 rounded-md bg-yellow-50 p-2 flex"
          >
            <div
              class="w-4 h-4 flex items-center ri-alert-fill text-yellow-500"
            />
            <div class="flex-grow text-yellow-900 text-2xs leading-4.5 pl-2">
              Repository mapping is not reversible. Once GitLab is connected,
              you won't be able to update these settings and reconnecting a
              different organization or repositories won't override past
              activities.
            </div>
          </div>
        </section>

        <section class="pb-4">
          <el-input
            v-model="search"
            clearable
            placeholder="Search repositories..."
          >
            <template #prefix>
              <i class="ri-search-line text-gray-400" />
            </template>
          </el-input>
        </section>

        <!-- Repository mapping -->
        <section v-if="filteredProjects.length > 0">
          <div class="flex border-b border-gray-200 items-center h-8">
            <div class="w-1/2 pr-4">
              <p
                class="text-3xs uppercase text-gray-400 font-semibold tracking-1"
              >
                REPOSITORY
              </p>
            </div>
            <div class="w-1/2 pr-4">
              <p
                class="text-3xs uppercase text-gray-400 font-semibold tracking-1"
              >
                SUB-PROJECT
              </p>
            </div>
          </div>
          <div class="py-1.5">
            <article
              v-for="project in filteredProjects"
              :key="project.id"
              class="py-1.5 flex items-center"
            >
              <div class="w-1/2 flex items-center pr-4">
                <i class="ri-git-repository-line text-base mr-2" />
                <p class="text-2xs leading-5 flex-grow truncate">
                  {{ project.path_with_namespace }}
                </p>
              </div>
              <div class="w-1/2 flex items-center">
                <app-form-item
                  :validation="$v[project.web_url]"
                  :error-messages="{
                    required: 'This field is required',
                  }"
                  class="mb-0 flex-grow"
                  error-class="relative top-0"
                >
                  <el-select
                    v-model="form[project.web_url]"
                    placeholder="Select sub-project"
                    class="w-full"
                    placement="bottom-end"
                    filterable
                    @blur="$v[project.web_url].$touch"
                    @change="$v[project.web_url].$touch"
                  >
                    <el-option
                      v-for="subproject of subprojects"
                      :key="subproject.id"
                      :value="subproject.id"
                      :label="subproject.name"
                    />
                  </el-select>
                </app-form-item>
                <el-switch
                  v-model="form[project.web_url]"
                  class="ml-2"
                  active-color="#13ce66"
                  inactive-color="#ff4949"
                  @change="toggleRepo(project.web_url)"
                />
              </div>
            </article>
          </div>
        </section>
        <section v-else>
          <p class="text-center text-sm text-gray-500 mb-4">
            No repositories found
          </p>
        </section>
      </div>
    </template>

    <template #footer>
      <div style="flex: auto">
        <el-button
          class="btn btn--md btn--bordered mr-3"
          @click="isDrawerVisible = false"
        >
          Cancel
        </el-button>
        <el-button
          type="primary"
          class="btn btn--md btn--primary"
          :disabled="sending || $v.$invalid"
          :loading="sending"
          @click="connect()"
        >
          Connect
        </el-button>
      </div>
    </template>
  </app-drawer>
</template>

<script lang="ts" setup>
import {
  computed, onMounted,
  ref,
} from 'vue';
import Message from '@/shared/message/message';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import { LfService } from '@/modules/lf/segments/lf-segments-service';
import { useRoute, useRouter } from 'vue-router';
import { required } from '@vuelidate/validators';
import useVuelidate from '@vuelidate/core';
import AppFormItem from '@/shared/form/form-item.vue';
import { IntegrationService } from '@/modules/integration/integration-service';
import ConfirmDialog from '@/shared/dialog/confirm-dialog';
import { mapActions } from '@/shared/vuex/vuex.helpers';
import { showIntegrationProgressNotification } from '@/modules/integration/helpers/integration-progress-notification';

const props = defineProps<{
  modelValue: boolean,
  integration: any
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void }>();

const route = useRoute();
const router = useRouter();

// Store
const { doFetch } = mapActions('integration');

// Drawer visibility
const isDrawerVisible = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});

// Search
const search = ref('');

// Connected user
const connectedUser = computed(() => props.integration?.settings?.user || null);

// Connected groups
const connectedGroups = computed(() => props.integration?.settings?.groups || []);

const pathToFullURL = (path: string) => `https://gitlab.com/${path}`;

// All projects (user projects + group projects)
const allProjects = computed(() => {
  const userProjects = props.integration?.settings?.userProjects || [];
  const groupProjects = Object.values(props.integration?.settings?.groupProjects || {}).flat();
  return [...userProjects, ...groupProjects].map((project) => ({
    ...project,
    web_url: pathToFullURL(project.path_with_namespace),
  }));
});

const filteredProjects = computed(() => allProjects.value.filter((p: any) => p.path_with_namespace.toLowerCase().includes(search.value.toLowerCase())));

// Static gitlab details
const gitlabDetails = computed(() => CrowdIntegrations.getConfig('gitlab'));

// Form
const form = ref<Record<string, string>>(allProjects.value.reduce((a: Record<string, any>, b: any) => ({
  ...a,
  [b.web_url]: props.integration.segmentId,
}), {}));

const rules = computed(() => allProjects.value.reduce((a: Record<string, any>, b: any) => ({
  ...a,
  [b.web_url]: {
    required,
  },
}), {}));

const $v = useVuelidate(rules, form);

// Connecting
const sending = ref(false);

const connect = () => {
  const data = { ...form.value };
  ConfirmDialog({
    type: 'warning',
    title: 'Are you sure you want to proceed?',
    message:
        'Repository mapping is not reversible. Once GitLab is connected, you won\'t be able to update these settings.\n\n'
        + 'Reconnecting a different organization and/or repositories won\'t remove past activities. '
        + 'In order to clean up existing data please reach out to our support team.',
    confirmButtonText: 'Connect GitLab',
    cancelButtonText: 'Cancel',
    icon: 'ri-alert-fill',
  } as any)
    .then(() => {
      IntegrationService.mapGitlabRepos(props.integration.id, data, [props.integration.segmentId])
        .then(() => {
          isDrawerVisible.value = false;

          doFetch([props.integration.segmentId]);

          showIntegrationProgressNotification('gitlab', props.integration.segmentId);

          router.push({
            name: 'integration',
            params: {
              id: props.integration.segmentId,
            },
          });
        })
        .catch((e) => {
          Message.error(
            'There was an error mapping gitlab repos',
          );
          console.error(e);
        });
    });
};

// Fetching subprojects
const subprojects = ref([]);

const fetchSubProjects = () => {
  LfService.findSegment(route.params.grandparentId)
    .then((segment) => {
      subprojects.value = segment.projects.map((p) => p.subprojects).flat();
    });
};

onMounted(() => {
  fetchSubProjects();
});

// Check if group has projects
const groupHasProjects = (group: any) => props.integration?.settings?.groupProjects?.[group.id]?.length > 0;

// Toggle repo
const toggleRepo = (projectUrl: string) => {
  if (form.value[projectUrl]) {
    form.value[projectUrl] = '';
  } else {
    form.value[projectUrl] = props.integration.segmentId;
  }
  $v.value[projectUrl].$touch();
};
</script>

<script lang="ts">
export default {
  name: 'AppGitlabSettingsDrawer',
};
</script>
