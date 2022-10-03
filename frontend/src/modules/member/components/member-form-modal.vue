<template>
  <div>
    <el-dialog
      v-model="dialogVisible"
      :close-on-click-modal="false"
      :title="title"
      width="80%"
    >
      <app-member-form
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
import MemberForm from '@/modules/member/components/member-form.vue'
import { MemberService } from '@/modules/member/member-service'
import { i18n } from '@/i18n'
import Errors from '@/shared/error/errors'

export default {
  name: 'AppMemberFormModal',

  components: {
    'app-member-form': MemberForm
  },

  props: {
    visible: {
      type: Boolean,
      default: false
    }
  },
  emits: ['close', 'success'],

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
      return i18n('entities.member.new.title')
    }
  },

  methods: {
    async doSubmit(payload) {
      try {
        this.saveLoading = true
        const { id } = await MemberService.create(
          payload.values
        )
        const record = await MemberService.find(id)
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
