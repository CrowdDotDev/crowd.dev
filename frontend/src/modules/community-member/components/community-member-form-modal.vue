<template>
  <div>
    <el-dialog
      v-model:visible="dialogVisible"
      :title="title"
      width="80%"
    >
      <app-community-member-form
        :modal="true"
        :record="record"
        :save-loading="saveLoading"
        @cancel="doCancel"
        @submit="doSubmit"
      />
    </el-dialog>
  </div>
</template>

<script>
import CommunityMemberForm from '@/modules/community-member/components/community-member-form.vue'
import { CommunityMemberService } from '@/modules/community-member/community-member-service'
import { i18n } from '@/i18n'
import Errors from '@/shared/error/errors'

export default {
  name: 'AppCommunityMemberFormModal',

  components: {
    'app-community-member-form': CommunityMemberForm
  },

  props: ['visible'],

  data() {
    return {
      record: null,
      saveLoading: false
    }
  },

  computed: {
    dialogVisible: {
      get: function () {
        return this.visible
      },

      set: function (value) {
        if (!value) {
          this.$emit('close')
        }
      }
    },

    title() {
      return i18n('entities.communityMember.new.title')
    }
  },

  methods: {
    async doSubmit(payload) {
      try {
        this.saveLoading = true
        const { id } = await CommunityMemberService.create(
          payload.values
        )
        const record = await CommunityMemberService.find(id)
        this.$emit('success', record)
      } catch (error) {
        Errors.handle(error)
      } finally {
        this.saveLoading = false
      }
    },

    doCancel() {
      this.dialogVisible = false
    }
  }
}
</script>

<style></style>
