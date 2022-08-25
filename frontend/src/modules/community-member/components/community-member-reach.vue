<template>
  <div class="reach">
    <el-tooltip
      placement="top"
      ref="tooltip"
      :disabled="member.reach.total === -1"
    >
      <div slot="content">
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
      <span v-if="member.reach.total !== -1">{{
        member.reach.total
      }}</span>
      <span v-else></span>
    </el-tooltip>
  </div>
</template>

<script>
export default {
  name: 'app-community-member-reach',
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
