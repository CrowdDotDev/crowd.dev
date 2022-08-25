<template>
  <div class="conversation-published-tabs">
    <div class="inline-flex items-center -mx-2">
      <button
        class="conversation-published-tabs-item font-semibold"
        :class="
          active === undefined || active === null
            ? 'conversation-published-tabs-item--active'
            : ''
        "
        @click="handleClick(undefined)"
      >
        All Statuses
      </button>
      <button
        class="conversation-published-tabs-item font-semibold"
        :class="
          active
            ? 'conversation-published-tabs-item--active'
            : ''
        "
        @click="handleClick(true)"
      >
        Published
      </button>
      <button
        class="conversation-published-tabs-item font-semibold"
        :class="
          active === false
            ? 'conversation-published-tabs-item--active'
            : ''
        "
        @click="handleClick(false)"
      >
        Unpublished
      </button>
    </div>
  </div>
</template>

<script>
import { mapGetters, mapActions } from 'vuex'
import { FilterSchema } from '@/shared/form/filter-schema'
import { ConversationModel } from '@/modules/conversation/conversation-model'

const { fields } = ConversationModel

const filterSchema = new FilterSchema([fields.published])

export default {
  name: 'app-conversation-published-tabs',
  computed: {
    ...mapGetters({
      filter: 'conversation/filter'
    }),
    active() {
      return this.filter.published
    }
  },
  methods: {
    ...mapActions({
      doFetch: 'conversation/doFetch'
    }),
    async handleClick(value) {
      const rawFilter = {
        ...this.filter,
        published: value
      }
      const filter = filterSchema.cast(rawFilter)
      return this.doFetch({ rawFilter, filter })
    }
  }
}
</script>

<style lang="scss">
.conversation-published-tabs {
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
