<template>
  <div class="grid grid-cols-3">
    <!-- Row 0: Names -->
    <div></div>
    <div
      v-for="member in props.pair"
      :key="member.id"
      :class="{
        'main-member': member.id === pair[0].id,
        'second-member': member.id === pair[1].id,
        middle: member.id === pair[0].id
      }"
      class="row"
    >
      <div class="flex mb-4">
        <app-avatar
          :entity="props.pair[0]"
          size="sm"
          class="mr-2"
        />
        <div class="pt-2 text-gray-900">
          {{ member.displayName }}
        </div>
        <button
          v-if="member.id === pair[1].id"
          @click="handleMakePrimary"
          class="btn bg-transparent ml-auto"
        >
          <i
            class="ri-arrow-up-down-line ri-lg text-brand-600"
          ></i>
          <span class="text-brand-600">Make primary</span>
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
    <div
      v-for="member in props.pair"
      :key="member.id"
      :class="{
        middle: member.id === pair[0].id
      }"
      class="row"
    >
      <app-member-engagement-level :member="member" />
    </div>
    <!-- Row 2: Location -->
    <div class="row">Location</div>
    <div
      v-for="member in props.pair"
      :key="member.id"
      :class="{
        middle: member.id === pair[0].id
      }"
      class="row"
    >
      {{ member.attributes?.location?.default }}
    </div>
    <!-- Row 3: Organization -->
    <div class="row">Organization</div>
    <div
      v-for="member in props.pair"
      :key="member.id"
      :class="{
        middle: member.id === pair[0].id
      }"
      class="row"
    >
      <app-member-organizations
        :member="member"
        :showTitle="false"
      />
    </div>
    <!-- Row 4: Title -->
    <div class="row">Title</div>
    <div
      v-for="member in props.pair"
      :key="member.id"
      :class="{
        middle: member.id === pair[0].id
      }"
      class="row"
    >
      {{ member.attributes?.jobTitle?.default }}
    </div>
    <!-- Row 5: Member since -->
    <div class="row">Member since</div>
    <div
      v-for="member in props.pair"
      :key="member.id"
      :class="{
        middle: member.id === pair[0].id
      }"
      class="row"
    >
      {{ member.joinedAt.split('T')[0] }}
    </div>
    <!-- Row 7: Tags -->
    <div class="row">Tags</div>
    <div
      v-for="member in props.pair"
      :key="member.id"
      :class="{
        middle: member.id === pair[0].id
      }"
      class="row"
    >
      <app-tag-list :member="member" :editable="false" />
    </div>

    <!-- Row 8: Identities header -->
    <div
      class="row col-span-3 bg-gray-50 border-t border-gray-200 uppercase font-semibold text-xs"
    >
      Identities
    </div>
    <!-- Following rows: one for each identity -->
    <div
      v-for="identity in identities"
      :key="identity.key"
      class="row flex items-center"
      :class="{
        middle: identity.middle
      }"
    >
      <div
        v-if="identity.type === 'email-platform'"
        class="flex items-center"
      >
        <span
          class="block btn p-2 mr-2 bg-white text-brand-500 border border-gray-200"
        >
          <i class="ri-mail-line"></i
        ></span>
        <span class="block text-gray-500"> Email </span>
      </div>
      <div v-else-if="identity.type === 'email'">
        <a
          :href="`mailto:${identity.url}`"
          class="leading-none cursor-pointer text-gray-900 underline"
          @click.stop="trackClick('Email')"
        >
          {{ identity.url }}
        </a>
      </div>
      <div
        v-else-if="identity.type === 'platform'"
        class="flex items-center"
      >
        <span
          class="btn p-2 text-base cursor-auto hover:cursor-auto bg-white border border-gray-200 mr-2"
          :class="`btn--${identity.platform}`"
        >
          <img
            :src="identity.image"
            :alt="identity.name"
            class="member-channels-icon"
          />
        </span>
        <span class="text-gray-500">
          {{ identity.name }}
        </span>
      </div>
      <div
        v-else-if="identity.type === 'identity'"
        class="flex items-center"
      >
        <span v-if="identity.url">
          <a
            :href="identity.url"
            class="leading-none cursor-pointer text-gray-900 underline"
            target="__blank"
          >
            {{ identity.url }}</a
          ></span
        >
        <span v-else>{{ identity.username }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppMemberMergeSuggestionsDetails'
}
</script>

<script setup>
import { defineProps, computed, defineEmits } from 'vue'
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue'
import AppTagList from '@/modules/tag/components/tag-list'
import AppMemberEngagementLevel from './member-engagement-level'
import integrationsJsonArray from '@/jsons/integrations.json'

const props = defineProps({
  pair: {
    type: Array,
    required: true
  }
})

const emit = defineEmits(['makePrimary'])

const identities = computed(() => {
  const p1 = props.pair[0].username
  console.log(p1)
  const integrationsFiltered = integrationsJsonArray.filter(
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
        url: member.attributes.url?.[platform.platform],
        username: member.username[platform.platform]
      })
    }
  }
  return out
})

function trackClick(channel) {
  window.analytics.track('Click Member Contact', {
    channel
  })
}

function handleMakePrimary() {
  emit('makePrimary')
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
