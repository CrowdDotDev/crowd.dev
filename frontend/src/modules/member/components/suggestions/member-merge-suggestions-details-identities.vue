<template>
  <div
    v-for="(identity, index) in identities"
    :key="identity.key"
    class="row flex items-center"
    :class="{
      middle: identity.middle,
      'col-span-2':
        identity.middle ||
        (index !== 0 && (index + 1) % 3) === 0
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
    <div v-else-if="identity.type === 'identity'">
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
</template>

<script>
export default {
  name: 'MemberMergeSuggestionsDetailsIdentities',
  props: {
    identities: {
      type: Object,
      default: () => {}
    }
  },
  methods: {
    trackClick(channel) {
      window.analytics.track('Click Member Contact', {
        channel
      })
    }
  }
}
</script>
