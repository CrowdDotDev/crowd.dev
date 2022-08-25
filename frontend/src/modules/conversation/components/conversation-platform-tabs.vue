<template>
  <div class="conversation-platform-tabs">
    <div class="inline-flex items-center -mx-2">
      <button
        class="conversation-platform-tabs-item font-semibold"
        :class="
          active
            ? ''
            : 'conversation-platform-tabs-item--active'
        "
        @click="handleClick(null)"
      >
        All Platforms
      </button>
      <button
        v-for="platform in platforms"
        :key="platform.name"
        class="conversation-platform-tabs-item"
        :class="
          active === platform.name
            ? 'conversation-platform-tabs-item--active'
            : ''
        "
        @click="handleClick(platform.name)"
      >
        <i
          class="ri-lg flex items-center"
          :class="platform.icon"
        ></i>
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { FilterSchema } from '@/shared/form/filter-schema'
import { ConversationModel } from '@/modules/conversation/conversation-model'

const { fields } = ConversationModel

const filterSchema = new FilterSchema([fields.platform])

export default {
  name: 'app-conversation-status-tabs',
  data() {
    return {
      platforms: [
        { name: 'slack', icon: 'ri-slack-fill' },
        { name: 'github', icon: 'ri-github-fill' },
        // { name: 'twitter', icon: 'ri-twitter-fill' },
        { name: 'discord', icon: 'ri-discord-fill' }
      ]
    }
  },
  computed: {
    ...mapGetters({
      filter: 'conversation/filter'
    }),
    active() {
      return this.filter.platform
    }
  },
  methods: {
    ...mapActions({
      doFetch: 'conversation/doFetch'
    }),
    async handleClick(value) {
      const rawFilter = {
        ...this.filter,
        platform: value
      }
      const filter = filterSchema.cast(rawFilter)
      return this.doFetch({ rawFilter, filter })
    }
  }
}
</script>

<style lang="scss">
.conversation-platform-tabs {
  @apply bg-white rounded-lg p-2 px-4;
  border: 1px solid #e9e9e9;

  &-item {
    @apply mx-2 text-gray-500;
    transition: 0.2s;

    &:hover:not(&--active) {
      @apply text-gray-800;
    }

    &--active {
      @apply relative text-primary-900;
    }
  }
}
</style>
