<template>
  <lf-modal v-model="isModalOpen">
    <div class="pt-5 pb-6 px-6">
      <div class="flex justify-between items-center pb-5">
        <h5>
          Sync repositories/organizations
        </h5>
        <lf-button type="secondary-ghost" icon-only @click="isModalOpen = false">
          <lf-icon name="xmark" />
        </lf-button>
      </div>
      <lf-search
        v-model="search"
        :lazy="true"
        class="!h-9"
        placeholder="Search GitHub repositories, or organizations..."
      />

      <div class="pt-4">
        <!-- Loading and empty search state -->
        <div v-if="!search || loading" class="flex flex-col items-center pb-6">
          <div class="py-4">
            <img
              src="/images/integrations/github-search.png"
              alt="GitHub Search"
              class="w-full max-w-100"
              :class="{ 'animate-pulse': loading }"
            />
          </div>
          <p v-if="loading" class="text-medium text-gray-500">
            Searching for repositories and organizations...
          </p>
          <p v-else class="font-semibold text-medium">
            Explore the entire GitHub database and sync any repository
          </p>
        </div>
        <div v-else class="min-h-104">
          <lf-tabs v-model="tab" class="!w-full" :fragment="false">
            <lf-tab name="repositories" class="flex-grow">
              Repositories
            </lf-tab>
            <lf-tab name="organizations" class="flex-grow">
              Organizations
            </lf-tab>
          </lf-tabs>

          <!-- Repositories -->
          <div v-if="tab === 'repositories'" class="flex flex-col gap-5 mt-6">
            <!-- Repository list item -->
            <article v-for="repo of resultRepositories" :key="repo.url" class="flex justify-between items-center">
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
              <div>
                <lf-button
                  v-if="isRepositoryAdded(repo)"
                  type="primary-ghost"
                  size="small"
                  class="!bg-primary-50 group"
                  @click="removeRepository(repo)"
                >
                  <lf-icon name="check" type="regular" class="group-hover:hidden" />
                  <lf-icon name="circle-minus" type="regular" class="!hidden group-hover:!block" />
                  <span class="group-hover:hidden">Synced</span>
                  <span class="hidden group-hover:block">Stop syncing</span>
                </lf-button>
                <lf-button v-else type="primary-ghost" size="small" @click="addRepository(repo)">
                  Sync repository
                </lf-button>
              </div>
            </article>
          </div>

          <!-- Organizations -->
          <div v-else-if="tab === 'organizations'" class="pt-4">
            <div class="flex items-center gap-1.5 pb-8">
              <lf-icon name="info-circle" :size="20" class="text-gray-500" />
              <p class="text-gray-500 text-tiny">
                Sync all existing and future repositories within GitHub organization.
              </p>
            </div>
            <div class="flex flex-col gap-5">
              <!-- Organization list item -->
              <article v-for="org of resultOrganizations" :key="org.url" class="flex justify-between items-center">
                <div class="flex items-center gap-3">
                  <lf-avatar :name="org.name" :src="org.image" :size="32" class="!rounded border border-gray-200">
                    <template #placeholder>
                      <div class="w-full h-full bg-gray-50 flex items-center justify-center">
                        <lf-icon-old name="community-line" :size="12" class="text-gray-400" />
                      </div>
                    </template>
                  </lf-avatar>
                  <div>
                    <p class="text-small font-semibold mb-0.5">
                      {{ org.name }}
                    </p>
                    <div class="flex items-center gap-1">
                      <lf-icon-old name="git-repository-line" class="text-gray-500" :size="16" />
                      <p class="text-tiny text-gray-500">
                        {{ org.repositories.length }} repositories
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <lf-button
                    v-if="isOrganizationSynced(org)"
                    type="primary-ghost"
                    size="small"
                    class="!bg-primary-50 group"
                    @click="removeOrganizations(org)"
                  >
                    <lf-icon name="check" type="regular" class="group-hover:hidden" />
                    <lf-icon name="circle-minus" type="regular" class="!hidden group-hover:!block" />
                    <span class="group-hover:hidden">Synced</span>
                    <span class="hidden group-hover:block">Stop syncing</span>
                  </lf-button>
                  <lf-button v-else type="primary-ghost" size="small" @click="addOrganizations(org)">
                    Sync organization
                  </lf-button>
                </div>
              </article>
            </div>
          </div>
        </div>
      </div>
    </div>
  </lf-modal>
</template>

<script lang="ts" setup>
import { computed, ref, watch } from 'vue';
import LfModal from '@/ui-kit/modal/Modal.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import LfSearch from '@/ui-kit/search/Search.vue';
import LfTabs from '@/ui-kit/tabs/Tabs.vue';
import LfTab from '@/ui-kit/tabs/Tab.vue';
import LfIconOld from '@/ui-kit/icon/IconOld.vue';
import LfAvatar from '@/ui-kit/avatar/Avatar.vue';
import { GithubApiService } from '@/config/integrations/github/services/github.api.service';
import Message from '@/shared/message/message';

const props = defineProps<{
  modelValue: boolean,
  organizations: any[],
  repositories: any[],
}>();

const emit = defineEmits<{(e: 'update:modelValue', value: boolean): void,
  (e: 'update:organizations', value: any[]): void,
  (e: 'update:repositories', value: any[]): void }>();

const search = ref('');
const loading = ref(false);
const tab = ref('repositories');

const isModalOpen = computed({
  get() { return props.modelValue; },
  set(val) { emit('update:modelValue', val); },
});

const repositories = computed({
  get() { return props.repositories; },
  set(value) { emit('update:repositories', value); },
});

const organizations = computed({
  get() { return props.organizations; },
  set(value) { emit('update:organizations', value); },
});

const isRepositoryAdded = (repo: any) => repositories.value.some((r: any) => r.url === repo.url);
const isOrganizationSynced = (org: any) => organizations.value.some((o: any) => o.url === org.url);

const addRepository = (repo: any) => {
  if (!repositories.value.some((r: any) => repo.url === r.url)) {
    repositories.value.push(repo);
  }
};
const addOrganizations = (org: any) => {
  organizations.value.push(org);
  const newRepositories = org.repositories.filter((r: any) => !repositories.value.some((repo: any) => repo.url === r.url));
  repositories.value = [...repositories.value, ...newRepositories];
};

const removeRepository = (repo: any) => {
  repositories.value = repositories.value.filter((r: any) => r.url !== repo.url);
};
const removeOrganizations = (org: any) => {
  organizations.value = organizations.value.filter((o: any) => o.url !== org.url);
};

const resultRepositories = ref<any[]>([
  {
    url: 'https://github.com/FabEdge/fabedge',
    fork: false,
    name: 'fabedge',
    owner: 'FabEdge',
    private: false,
    cloneUrl: 'https://github.com/FabEdge/fabedge.git',
    createdAt: '2021-07-16T08:45:38Z',
  }, {
    url: 'https://github.com/FabEdge/fab-dns',
    fork: false,
    name: 'fab-dns',
    owner: 'FabEdge',
    private: false,
    cloneUrl: 'https://github.com/FabEdge/fab-dns.git',
    createdAt: '2021-12-14T02:44:36Z',
  }, {
    url: 'https://github.com/FabEdge/helm-chart',
    fork: false,
    name: 'helm-chart',
    owner: 'FabEdge',
    private: false,
    cloneUrl: 'https://github.com/FabEdge/helm-chart.git',
    createdAt: '2022-02-17T03:44:45Z',
  }, {
    url: 'https://github.com/FabEdge/fabctl',
    fork: false,
    name: 'fabctl',
    owner: 'FabEdge',
    private: false,
    cloneUrl: 'https://github.com/FabEdge/fabctl.git',
    createdAt: '2022-03-14T03:10:13Z',
  }, {
    url: 'https://github.com/FabEdge/net-tool',
    fork: false,
    name: 'net-tool',
    owner: 'FabEdge',
    private: false,
    cloneUrl: 'https://github.com/FabEdge/net-tool.git',
    createdAt: '2022-06-24T02:33:58Z',
  }, {
    url: 'https://github.com/FabEdge/strongswan',
    fork: false,
    name: 'strongswan',
    owner: 'FabEdge',
    private: false,
    cloneUrl: 'https://github.com/FabEdge/strongswan.git',
    createdAt: '2023-03-22T08:00:31Z',
  },
]);

const resultOrganizations = ref<any[]>([{
  url: 'https://github.com/FabEdge',
  name: 'FabEdge',
  image: 'https://avatars.githubusercontent.com/u/85610065?s=200&v=4',
  repositories: [{
    url: 'https://github.com/FabEdge/fabedge',
    fork: false,
    name: 'fabedge',
    owner: 'FabEdge',
    private: false,
    cloneUrl: 'https://github.com/FabEdge/fabedge.git',
    createdAt: '2021-07-16T08:45:38Z',
  }, {
    url: 'https://github.com/FabEdge/fab-dns',
    fork: false,
    name: 'fab-dns',
    owner: 'FabEdge',
    private: false,
    cloneUrl: 'https://github.com/FabEdge/fab-dns.git',
    createdAt: '2021-12-14T02:44:36Z',
  }, {
    url: 'https://github.com/FabEdge/helm-chart',
    fork: false,
    name: 'helm-chart',
    owner: 'FabEdge',
    private: false,
    cloneUrl: 'https://github.com/FabEdge/helm-chart.git',
    createdAt: '2022-02-17T03:44:45Z',
  }, {
    url: 'https://github.com/FabEdge/fabctl',
    fork: false,
    name: 'fabctl',
    owner: 'FabEdge',
    private: false,
    cloneUrl: 'https://github.com/FabEdge/fabctl.git',
    createdAt: '2022-03-14T03:10:13Z',
  }, {
    url: 'https://github.com/FabEdge/net-tool',
    fork: false,
    name: 'net-tool',
    owner: 'FabEdge',
    private: false,
    cloneUrl: 'https://github.com/FabEdge/net-tool.git',
    createdAt: '2022-06-24T02:33:58Z',
  }, {
    url: 'https://github.com/FabEdge/strongswan',
    fork: false,
    name: 'strongswan',
    owner: 'FabEdge',
    private: false,
    cloneUrl: 'https://github.com/FabEdge/strongswan.git',
    createdAt: '2023-03-22T08:00:31Z',
  }],
},
{
  url: 'https://github.com/CrowdDotDev',
  name: 'crowd.dev',
  image: 'https://avatars.githubusercontent.com/u/85551972?s=200&v=4',
  repositories: [
    {
      url: 'https://github.com/CrowdDotDev/crowd.dev',
      fork: false,
      name: 'crowd.dev',
      owner: 'CrowdDotDev',
      private: false,
      cloneUrl: 'https://github.com/CrowdDotDev/crowd.dev.git',
      createdAt: '2023-03-22T08:00:31Z',
    },
  ],
}]);

const searchForResults = () => {
  loading.value = true;
  GithubApiService.searchReposAndOrgs(search.value)
    .then((res) => {
      resultRepositories.value = res.repositories;
      resultOrganizations.value = res.organizations;
    })
    .catch(() => {
      Message.error('There has been error fetching repositories and organizations');
    })
    .finally(() => {
      loading.value = false;
    });
};

watch(() => search.value, (value: string) => {
  if (value.length > 0) {
    searchForResults();
  }
});
</script>

<script lang="ts">
export default {
  name: 'LfGithubSettingsAddRepositoryModal',
};
</script>
