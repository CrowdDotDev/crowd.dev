<template>
  <app-drawer
    v-model="isDrawerVisible"
    title="GitHub"
    size="600px"
    pre-title="Integration"
    :show-footer="true"
    has-border
    @close="isDrawerVisible = false"
  >
    <template #beforeTitle>
      <img
        :src="githubDetails.image"
        class="w-6 h-6 mr-2"
        alt="GitHub logo"
      />
    </template>
    <template #content>
      <div>
        <!-- Connected organization info -->
        <section v-if="owner" class="border border-gray-200 rounded-md py-4 px-5 mb-6">
          <p class="text-2xs font-medium text-gray-400 mb-1">
            Connected organization
          </p>
          <div class="flex items-center">
            <div v-if="owner.logo" class="h-5 w-5 rounded border border-gray-200 mr-2">
              <img src="#" class="object-cover" :alt="owner.logo">
            </div>
            <p class="text-xs font-medium leading-5">
              {{ owner.name }}
            </p>
          </div>
        </section>

        <!-- Disclaimer -->
        <section class="pb-4">
          <div class="pb-4">
            <h6 class="text-sm font-medium leading-5 mb-2">
              Repository mapping
            </h6>
            <p class="text-2xs leading-4.5 text-gray-500">
              Select the subproject you want to map with each connected repository.
            </p>
          </div>
          <div class="border border-yellow-100 rounded-md bg-yellow-50 p-2 flex">
            <div class="w-4 h-4 flex items-center ri-alert-fill text-yellow-500" />
            <div class="flex-grow text-yellow-900 text-2xs leading-4.5 pl-2">
              Repository mapping is not reversible. Once GitHub is connected,
              you won’t be able to update these settings and reconnecting a different organization or repositories won’t override past activities.
            </div>
          </div>
        </section>

        <!-- Repository mapping -->
        <section>
          <div class="flex border-b border-gray-200 items-center h-8">
            <div class="w-1/2 pr-4">
              <p class="text-3xs uppercase text-gray-400 font-semibold tracking-1">
                REPOSITORY
              </p>
            </div>
            <div class="w-1/2 pr-4">
              <p class="text-3xs uppercase text-gray-400 font-semibold tracking-1">
                SUB-PROJECT
              </p>
            </div>
          </div>
          <div class="py-1.5">
            <article v-for="repo of repos" :key="repo.url" class="py-1.5 flex items-center">
              <div class="w-1/2 flex items-center">
                <i class="ri-git-repository-line text-base mr-2" />
                <p class="text-2xs leading-5 flex-grow truncate">
                  /{{ repo.name }}
                </p>
              </div>
              <div class="w-1/2">
                <app-form-item
                  :validation="$v[repo.url]"
                  :error-messages="{
                    required: 'This field is required',
                  }"
                  class="mb-0"
                  error-class="relative top-0"
                  :show-error="false"
                >
                  <el-select
                    v-model="form[repo.url]"
                    placeholder="Select sub-project"
                    class="w-full"
                    clearable
                    placement="bottom-end"
                    filterable
                    @blur="$v[repo.url].$touch"
                    @change="$v[repo.url].$touch"
                  >
                    <el-option
                      v-for="subproject of subprojects"
                      :key="subproject.id"
                      :value="subproject.id"
                      :label="subproject.name"
                    />
                  </el-select>
                </app-form-item>
              </div>
            </article>
          </div>
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
  computed, onMounted, reactive,
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
import { OrganizationService } from '@/modules/organization/organization-service';

const props = defineProps<{
  modelValue: boolean,
  integration: any
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void }>();

const route = useRoute();
const router = useRouter();

// Drawer visibility
const isDrawerVisible = computed({
  get() {
    return props.modelValue;
  },
  set(val) {
    emit('update:modelValue', val);
  },
});

// Display data
const repos = computed(() => props.integration?.settings?.repos || []);

const owner = computed<{name: string, logo?: string} | null>(() => (repos.value.length > 0 ? {
  name: repos.value[0].owner,
  logo: undefined,
} : null));

// Static github details
const githubDetails = computed(() => CrowdIntegrations.getConfig('github'));

// Form
const form = reactive<Record<string, string>>({});

const rules = computed(() => repos.value.reduce((a: Record<string, any>, b: any) => ({
  ...a,
  [b.url]: {
    required,
  },
}), {}));

const $v = useVuelidate(rules, form);

// Connecting
const sending = ref(false);

const connect = () => {
  const data = { ...form };
  ConfirmDialog({
    type: 'warning',
    title: 'Are you sure you want to proceed?',
    message:
        'Repository mapping is not reversible. Once GitHub is connected, you wont be able to update these settings.\n\n'
        + 'Reconnecting a different organization and/or repositories won’t remove past activities. '
        + 'In order to clean up existing data please reach out to our support team.',
    confirmButtonText: 'Connect GitHub',
    cancelButtonText: 'Cancel',
    icon: 'ri-alert-fill',
  } as any)
    .then(() => {
      IntegrationService.githubMapRepos(props.integration.id, data)
        .then(() => {
          isDrawerVisible.value = false;

          Message.success(
            'The first activities will show up in a couple of seconds. <br /> '
                + '<br /> This process might take a few minutes to finish, depending on the amount of data.',
            {
              title: 'GitHub integration created successfully',
            },
          );

          router.push({
            name: 'integration',
            params: {
              id: props.integration.segmentId,
            },
          });
        })
        .catch(() => {
          Message.error(
            'There was an error mapping github repos',
          );
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

</script>

<script lang="ts">
export default {
  name: 'AppGithubSettingsDrawer',
};
</script>
