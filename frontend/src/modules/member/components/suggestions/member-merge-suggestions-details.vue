<template>
  <div class="grid grid-cols-5">
    <!-- Row 0: Names -->
    <div></div>
    <div
      v-for="member in props.pair"
      :key="member.id"
      :class="{
        'main-member col-span-2': member.id === pair[0].id,
        'second-member  col-span-2':
          member.id === pair[1].id,
        middle: member.id === pair[0].id
      }"
      class="row"
    >
      <div class="flex mb-4">
        <app-avatar
          :entity="member"
          size="sm"
          class="mr-2"
        />
        <app-member-display-name
          custom-class="pt-2 text-gray-900"
          :member="member"
        />
        <button
          v-if="member.id === pair[1].id"
          class="btn btn-link btn-link--primary ml-auto"
          :disabled="isEditLockedForSampleData"
          @click="handleMakePrimary"
        >
          <i class="ri-arrow-left-right-line"></i>
          <span>Make primary</span>
        </button>
      </div>
      <span
        v-if="member.attributes?.bio"
        class="text-gray-500 text-xs pr-4 line-clamp"
      >
        {{ member.attributes.bio.default }}</span
      >
    </div>

    <!-- Row 1: Engagement level -->
    <div class="row left">Engagement level</div>
    <div class="middle row col-span-2">
      <app-member-engagement-level :member="pair[0]" />
    </div>
    <div class="row col-span-2">
      <app-member-engagement-level
        v-if="pair[1].id"
        :member="pair[1]"
      />
    </div>
    <!-- Row 2: Location -->
    <div class="row">Location</div>
    <div class="middle row col-span-2">
      {{ pair[0].attributes?.location?.default }}
    </div>
    <div class="row col-span-2">
      <span v-if="pair[1].id">{{
        pair[1].attributes?.location?.default
      }}</span>
    </div>
    <!-- Row 3: Organization -->
    <div class="row">Organization</div>
    <div class="middle row col-span-2">
      <app-member-organizations
        :member="pair[0]"
        :show-title="false"
      />
    </div>
    <div class="row col-span-2">
      <app-member-organizations
        v-if="pair[1].id"
        :member="pair[1]"
        :show-title="false"
      />
    </div>
    <!-- Row 4: Title -->
    <div class="row">Title</div>
    <div class="middle row col-span-2">
      <span>{{
        pair[0].attributes?.jobTitle?.default
      }}</span>
    </div>
    <div class="row col-span-2">
      <span v-if="pair[1].id">{{
        pair[1].attributes?.jobTitle?.default
      }}</span>
    </div>
    <!-- Row 5: Member since -->
    <div class="row">Member since</div>
    <div class="middle row col-span-2">
      {{ getJoinedAt(pair[0]) }}
    </div>
    <div class="middle row col-span-2">
      <span v-if="pair[1].id">{{
        getJoinedAt(pair[1])
      }}</span>
    </div>
    <!-- Row 7: Tags -->
    <div class="row">Tags</div>
    <div class="middle row col-span-2">
      <app-tag-list :member="pair[0]" :editable="false" />
    </div>
    <div class="row col-span-2">
      <app-tag-list
        v-if="pair[1].id"
        :member="pair[1]"
        :editable="false"
      />
    </div>

    <!-- Row 8: Identities header -->
    <div
      class="row col-span-5 bg-gray-50 border-t border-gray-200 uppercase font-semibold text-xs"
    >
      Identities
    </div>
    <!-- Following rows: one for each identity -->
    <app-member-merge-suggestions-details-identities
      :identities="identities"
    />
  </div>
</template>

<script>
export default {
  name: 'AppMemberMergeSuggestionsDetails'
}
</script>

<script setup>
import { defineProps, computed, defineEmits } from 'vue'
import AppMemberDisplayName from '@/modules/member/components/member-display-name'
import AppMemberOrganizations from '@/modules/member/components/member-organizations'
import AppTagList from '@/modules/tag/components/tag-list'
import AppMemberEngagementLevel from '../member-engagement-level'
import AppMemberMergeSuggestionsDetailsIdentities from './member-merge-suggestions-details-identities'
import { CrowdIntegrations } from '@/integrations/integrations-config'
import { MemberPermissions } from '../../member-permissions'
import { mapGetters } from '@/shared/vuex/vuex.helpers'

const props = defineProps({
  pair: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['makePrimary'])

const { currentTenant, currentUser } = mapGetters('auth')

const isEditLockedForSampleData = computed(() => {
  return new MemberPermissions(
    currentTenant.value,
    currentUser.value
  ).editLockedForSampleData
})

const identities = computed(() => {
  const integrationsFiltered =
    CrowdIntegrations.configs.filter(
      (x) =>
        Object.keys(props.pair[0].username).includes(
          x.platform
        ) ||
        Object.keys(props.pair[1].username).includes(
          x.platform
        )
    )
  const out = []

  if (props.pair[0].email || props.pair[1].email) {
    out.push({
      type: 'email-platform',
      key: 'email',
      name: 'E-mail'
    })
    out.push({
      type: 'email',
      key: `email-${props.pair[0].id}`,
      track: 'Email',
      middle: true,
      url: props.pair[0].email
    })
    out.push({
      type: 'email',
      key: `email-${props.pair[1].id}`,
      track: 'Email',
      url: props.pair[1].email
    })
  }

  for (const platform of integrationsFiltered) {
    out.push({
      type: 'platform',
      key: platform.platform,
      platform: platform.platform,
      name: platform.name,
      image: platform.image
    })
    for (const member of props.pair) {
      out.push({
        type: 'identity',
        key: `${platform.platform}-${member.id}`,
        middle: member.id === props.pair[0].id,
        track: platform.name,
        url: member.attributes?.url?.[platform.platform],
        username: member.username[platform.platform]
      })
    }
  }
  return out
})

function handleMakePrimary() {
  emit('makePrimary')
}

function getJoinedAt(member) {
  return member.joinedAt.includes('1970')
    ? '-'
    : member.joinedAt.split('T')[0]
}
</script>

<style lang="scss">
.row {
  @apply border-t border-t-gray-200 px-4 py-4 text-gray-900;
}

.middle {
  @apply border-r border-r-gray-200;
}

.left {
  @apply text-gray-500;
}

.main-member {
  @apply border-t-2 border-t-brand-500;
}

.second-member {
  @apply border-t-0;
}

.member-channels-icon {
  min-width: 1rem;
  min-height: 1rem;
  max-width: 1rem;
  max-height: 1rem;
}
</style>
