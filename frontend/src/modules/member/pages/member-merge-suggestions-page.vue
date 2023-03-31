<template>
  <app-page-wrapper size="narrow">
    <router-link
      class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center mt-1 mb-4"
      :to="{ path: '/members' }"
    >
      <i class="ri-arrow-left-s-line mr-2" />Members
    </router-link>
    <h4 class="text-xl font-semibold leading-9 mb-1">
      Merging suggestions
    </h4>
    <div class="text-xs text-gray-600 pb-6">
      crowd.dev is constantly checking your community for duplicate members. Here you can check all the merging
      suggestions.
    </div>

    <div v-if="loading || count > 0" class="panel">
      <!-- Header -->
      <header class="flex items-center justify-between pb-4">
        <button type="button" class="btn btn--transparent btn--md" :disabled="loading || offset <= 0" @click="fetch(offset - 1)">
          <span class="ri-arrow-left-s-line text-lg mr-2" />
          <span>Previous</span>
        </button>
        <app-loading v-if="loading" height="16px" width="131px" radius="3px" />
        <div v-else class="text-sm leading-5 text-gray-500">
          {{ offset + 1 }} of {{ count }} suggestions
        </div>
        <button
          type="button"
          class="btn btn--transparent btn--md"
          :disabled="loading || offset >= (count - 1)"
          @click="fetch(offset + 1)"
        >
          <span>Next</span>
          <span class="ri-arrow-right-s-line text-lg ml-2" />
        </button>
      </header>

      <!-- Comparison -->
      <!-- Loading -->
      <div v-if="loading" class="flex -mx-3">
        <article v-for="n in 2" :key="n" class="w-1/2 px-3">
          <div class="rounded p-6 transition pb-40" :class="{ 'bg-gray-50': n === 1 }">
            <app-loading height="48px" width="48px" radius="50%" class="mb-6" />

            <app-loading height="16px" width="172px" radius="3px" class="mb-6" />

            <app-loading height="12px" width="100%" radius="3px" class="mb-3" />
            <app-loading height="12px" width="80%" radius="3px" class="mb-8" />

            <app-loading height="12px" width="50%" radius="3px" class="mb-3" />
            <app-loading height="12px" width="50%" radius="3px" class="mb-3" />
            <app-loading height="12px" width="50%" radius="3px" class="mb-3" />
            <app-loading height="12px" width="50%" radius="3px" class="mb-3" />
            <app-loading height="12px" width="50%" radius="3px" class="mb-3" />
          </div>
        </article>
      </div>
      <div v-else class="flex -mx-3">
        <section v-for="(member, mi) of membersToMerge" :key="member.id" class="w-1/2 px-3">
          <div class="rounded p-6 transition h-full" :class="{ 'bg-gray-50': primary === mi }">
            <!-- primary member -->
            <div class="h-13">
              <div v-if="mi === primary" class="bg-brand-500 rounded-full py-0.5 px-2 text-white inline-block text-xs leading-5 font-medium">
                Primary member
              </div>
              <el-button v-else :disabled="isEditLockedForSampleData" type="button" class="btn btn--bordered btn--sm" @click="primary = mi">
                <span class="ri-arrow-left-right-fill text-base text-gray-600 mr-2" />
                <span>Make primary</span>
              </el-button>
            </div>
            <app-avatar :entity="member" class="mb-3" />
            <div class="pb-4">
              <h6 class="text-base text-black font-semibold" v-html="$sanitize(member.displayName)" />
              <div
                v-if="member.attributes.bio"
                class="text-gray-600 leading-5 text-xs truncate !whitespace-normal h-10"
                v-html="$sanitize(member.attributes.bio.default)"
              />
              <div v-else-if="membersHaveBio" class="h-10" />
            </div>

            <div>
              <article class="flex items-center justify-between h-12 border-b border-gray-200">
                <p class="text-2xs font-medium text-gray-500">
                  Engagement level
                </p>
                <app-community-engagement-level :member="member" />
              </article>
              <article class="flex items-center justify-between h-12 border-b border-gray-200">
                <p class="text-2xs font-medium text-gray-500">
                  Location
                </p>
                <p class="text-xs text-gray-900">
                  {{ member.attributes.location?.default || '-' }}
                </p>
              </article>
              <article class="flex items-center justify-between h-12 border-b border-gray-200">
                <p class="text-2xs font-medium text-gray-500">
                  Organization
                </p>
                <app-member-organizations
                  :member="member"
                  :show-title="false"
                />
              </article>
              <article class="flex items-center justify-between h-12 border-b border-gray-200">
                <p class="text-2xs font-medium text-gray-500">
                  Title
                </p>
                <p class="text-xs text-gray-900">
                  {{ member.attributes.jobTitle?.default || '-' }}
                </p>
              </article>
              <article class="flex items-center justify-between h-12 border-b border-gray-200">
                <p class="text-2xs font-medium text-gray-500">
                  Member since
                </p>
                <p class="text-xs text-gray-900">
                  {{ moment(member.joinedAt).format('YYYY-MM-DD') }}
                </p>
              </article>
              <article class="flex items-center justify-between h-12 border-b border-gray-200">
                <p class="text-2xs font-medium text-gray-500">
                  Tags
                </p>
                <app-tags v-if="member.tags.length > 0" :member="member" :editable="false" />
                <span v-else>-</span>
              </article>
            </div>
            <div class="pt-5">
              <a
                v-for="(username, platform) in member.username"
                :key="platform"
                :href="identityUrl(platform, username, member)"
                class="pb-2 pt-3 flex items-center text-gray-900 hover:text-brand-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  v-if="platformDetails(platform)"
                  :src="platformDetails(platform).image"
                  class="h5 w-5 mr-4"
                  :alt="platform"
                >
                <span class="text-xs leading-5">{{ username }}</span>
              </a>
              <a
                v-for="email of member.emails"
                :key="email"
                :href="`mailto:${email}`"
                class="pb-2 pt-3 flex items-center text-gray-900 hover:text-brand-500"
                target="_blank"
                rel="noopener noreferrer"
              >
                <span class="ri-mail-line text-lg text-gray-600" />
                <span class="text-xs leading-5">{{ email }}</span>
              </a>
            </div>
          </div>
        </section>
      </div>

      <!-- Actions -->
      <div class="flex -mx-3 pt-8">
        <div class="w-1/2 px-3">
          <el-button
            :disabled="loading || isEditLockedForSampleData"
            class="btn btn--bordered btn--lg w-full"
            :loading="sendingIgnore"
            @click="ignoreSuggestion()"
          >
            Ignore suggestion
          </el-button>
        </div>
        <div class="w-1/2 px-3">
          <el-button
            :disabled="loading || isEditLockedForSampleData"
            class="btn btn--primary btn--lg w-full"
            :loading="sendingMerge"
            @click="mergeSuggestion()"
          >
            Merge members
          </el-button>
        </div>
      </div>
    </div>
    <!-- Empty state -->
    <div v-else class="pt-20 flex flex-col items-center">
      <div class="ri-shuffle-line text-gray-200 text-10xl h-40 flex items-center mb-8" />
      <h5 class="text-center text-lg font-semibold mb-4">
        No merge suggestions
      </h5>
      <p class="text-sm text-center text-gray-600 leading-5">
        We couldn’t find any duplicated members
      </p>
    </div>
  </app-page-wrapper>
</template>

<script setup>
import {
  ref, onMounted, computed,
} from 'vue';
import Message from '@/shared/message/message';
import { mapGetters } from '@/shared/vuex/vuex.helpers';
import AppAvatar from '@/shared/avatar/avatar.vue';
import AppCommunityEngagementLevel from '@/modules/member/components/member-engagement-level.vue';
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue';
import moment from 'moment';
import AppTags from '@/modules/tag/components/tag-list.vue';
import { CrowdIntegrations } from '@/integrations/integrations-config';
import AppLoading from '@/shared/loading/loading-placeholder.vue';
import { MemberService } from '../member-service';
import { MemberPermissions } from '../member-permissions';

const { currentTenant, currentUser } = mapGetters('auth');

const membersToMerge = ref([]);
const primary = ref(0);
const offset = ref(0);
const count = ref(0);
const loading = ref(false);

const sendingIgnore = ref(false);
const sendingMerge = ref(false);

const isEditLockedForSampleData = computed(() => new MemberPermissions(
  currentTenant.value,
  currentUser.value,
).editLockedForSampleData);

const membersHaveBio = computed(() => membersToMerge.value.some((m) => !!m.attributes.bio));

const platformDetails = (platform) => CrowdIntegrations.getConfig(platform);
const identityUrl = (platform, username, member) => {
  if (platform === 'hackernews') {
    return `https://news.ycombinator.com/user?id=${username}`;
  } if (
    platform === 'linkedin'
    && username.includes('private-')
  ) {
    return null;
  }
  return member.attributes.url?.[platform];
};
const fetch = (page) => {
  if (page > -1) {
    offset.value = page;
  }
  loading.value = true;

  MemberService.fetchMergeSuggestions(
    1,
    offset.value,
  )
    .then((res) => {
      offset.value = +res.offset;
      count.value = res.count;
      [membersToMerge.value] = res.rows;
    })
    .catch(() => {
      Message.error('There was an error fetching merge suggestion, please try again later');
    })
    .finally(() => {
      loading.value = false;
    });
};

const ignoreSuggestion = () => {
  if (sendingIgnore.value || sendingMerge.value || loading.value) {
    return;
  }
  sendingIgnore.value = true;
  MemberService.addToNoMerge(...membersToMerge.value)
    .then(() => {
      Message.success(
        'Merging suggestion ignored successfuly',
      );
      fetch();
    })
    .catch(() => {
      Message.error(
        'There was an error ignoring the merging suggestion',
      );
    })
    .finally(() => {
      sendingIgnore.value = false;
    });
};

const mergeSuggestion = () => {
  if (sendingIgnore.value || sendingMerge.value || loading.value) {
    return;
  }
  sendingMerge.value = true;
  primary.value = 0;
  MemberService.merge(
    membersToMerge.value[primary.value],
    membersToMerge.value[(primary.value + 1) % 2],
  )
    .then(() => {
      Message.success('Members merged successfuly');
      fetch();
    })
    .catch(() => {
      Message.error('There was an error merging members');
    })
    .finally(() => {
      sendingMerge.value = false;
    });
};

onMounted(async () => {
  fetch(0);
});
</script>

<script>
export default {
  name: 'AppMemberMergeSuggestionsPage',
};
</script>
