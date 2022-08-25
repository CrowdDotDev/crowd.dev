<template>
  <div>
    <el-tooltip
      content="Double click to edit"
      effect="dark"
      placement="top"
    >
      <div
        class="inline-flex items-center flex-wrap"
        @dblclick="editing = true"
      >
        <span
          class="tag mr-2 my-1"
          v-for="tag in member.tags"
          :key="tag.id"
          >{{ tag.name }}</span
        >
        <span
          class="text-black opacity-50 italic"
          v-if="member.tags.length === 0"
          >No tags added</span
        >
      </div>
    </el-tooltip>
    <app-tag-popover
      :visible="editing"
      :loading="loading"
      @cancel="editing = false"
      @submit="doSubmit"
      v-model="model[fields.tags.name]"
    />
  </div>
</template>

<script>
import { i18n } from '@/i18n'
import Message from '@/shared/message/message'
import { mapActions } from 'vuex'
import { FormSchema } from '@/shared/form/form-schema'
import { CommunityMemberModel } from '@/modules/community-member/community-member-model'
import { CommunityMemberService } from '@/modules/community-member/community-member-service'
import AppTagPopover from '@/modules/tag/components/tag-popover'

const { fields } = CommunityMemberModel
const formSchema = new FormSchema([
  fields.username,
  fields.info,
  fields.tags,
  fields.email
])

export default {
  name: 'app-tags',
  components: { AppTagPopover },
  props: {
    member: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    fields() {
      return fields
    }
  },
  watch: {
    member: {
      handler(newValue) {
        this.model = formSchema.initialValues(
          newValue || {}
        )
      },
      deep: true
    }
  },
  data() {
    return {
      rules: formSchema.rules(),
      model: null,
      editing: false,
      loading: false
    }
  },
  methods: {
    ...mapActions({
      doUpdate: 'communityMember/form/doUpdate'
    }),
    async doSubmit() {
      this.loading = true
      await CommunityMemberService.update(
        this.member.id,
        formSchema.cast(this.model)
      )
      this.loading = false
      this.editing = false
      Message.success(
        i18n('entities.communityMember.update.success')
      )
      this.$emit('tags-updated')
    }
  },
  created() {
    this.model = formSchema.initialValues(this.member || {})
  }
}
</script>

<style lang="scss">
.tags-form {
  .el-select {
    @apply w-full mt-3 mb-1;
  }
}
</style>
