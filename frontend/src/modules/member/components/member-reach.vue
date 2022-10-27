<template>
  <div class="reach">
    <el-tooltip
      ref="tooltip"
      placement="top"
      :disabled="member.reach.total === -1"
    >
      <template #content>
        <div>
          <div v-if="member.reach.github !== undefined">
            Github:
            <span class="font-semibold"
              >{{ member.reach.github }}
              {{
                member.reach.github === 1
                  ? 'follower'
                  : 'followers'
              }}</span
            >
          </div>
          <div v-if="member.reach.twitter !== undefined">
            Twitter:
            <span class="font-semibold"
              >{{ member.reach.twitter }}
              {{
                member.reach.twitter === 1
                  ? 'follower'
                  : 'followers'
              }}</span
            >
          </div>
        </div>
      </template>
      <div>
        <span v-if="member.reach.total !== -1">{{
          member.reach.total
        }}</span>
        <span v-else></span>
      </div>
    </el-tooltip>
  </div>
</template>

<script>
export default {
  name: 'AppMemberReach',
  props: {
    member: {
      type: Object,
      default: () => {}
    }
  }
}
</script>

<style lang="scss">
.reach {
  .app-page-spinner {
    @apply min-h-6;
  }
}
</style>
