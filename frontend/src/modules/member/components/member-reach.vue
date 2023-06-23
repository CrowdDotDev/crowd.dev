<template>
  <div class="reach">
    <el-tooltip
      ref="tooltip"
      placement="top-start"
      :disabled="member.reach.total === -1"
    >
      <template #content>
        <div>
          <div v-if="member.reach.github !== undefined">
            Github:
            <span class="font-semibold">{{
                                          formatNumberToCompact(member.reach.github)
                                        }}
              {{
                member.reach.github === 1
                  ? 'follower'
                  : 'followers'
              }}</span>
          </div>
          <div v-if="member.reach.twitter !== undefined">
            Twitter:
            <span class="font-semibold">{{
                                          formatNumberToCompact(member.reach.twitter)
                                        }}
              {{
                member.reach.twitter === 1
                  ? 'follower'
                  : 'followers'
              }}</span>
          </div>
        </div>
      </template>
      <div>
        <span v-if="typeof member.reach === 'number' && member.reach !== -1">{{
          formatNumberToCompact(member.reach)
        }}</span>
        <span v-else-if="typeof member.reach.total === 'number' && member.reach.total !== -1">{{
          formatNumberToCompact(member.reach.total)
        }}</span>
        <span v-else />
      </div>
    </el-tooltip>
  </div>
</template>

<script>
import { formatNumberToCompact } from '@/utils/number';

export default {
  name: 'AppMemberReach',
  props: {
    member: {
      type: Object,
      default: () => {},
    },
  },
  methods: {
    formatNumberToCompact,
  },
};
</script>

<style lang="scss">
.reach {
  .app-page-spinner {
    @apply min-h-6;
  }
}
</style>
