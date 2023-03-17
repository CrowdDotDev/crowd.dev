<template>
  <app-drawer
    v-model="drawerModel"
    size="35%"
    title="Edit identities"
    custom-class="identities-drawer"
  >
    <template #content>
      <el-form :model="memberModel">
        <app-member-form-identities
          v-model="memberModel"
          :show-header="false"
        />
      </el-form>
    </template>
    <template #footer>
      <div style="flex: auto">
        <el-button
          class="btn btn--md btn--bordered mr-3"
          @click="handleCancel"
          >Cancel</el-button
        >
        <el-button
          type="primary"
          class="btn btn--md btn--primary"
          :loading="loading"
          @click="handleSubmit"
          >Update</el-button
        >
      </div>
    </template>
  </app-drawer>
</template>

<script>
export default {
  name: 'AppMemberManageIdentitiesDrawer'
}
</script>

<script setup>
import { useStore } from 'vuex'
import {
  ref,
  defineEmits,
  defineProps,
  computed
} from 'vue'
import Message from '@/shared/message/message'
import AppMemberFormIdentities from './form/member-form-identities'
import { MemberService } from '@/modules/member/member-service'

const store = useStore()
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  member: {
    type: Object,
    default: () => {}
  }
})
const emit = defineEmits(['update:modelValue'])

const drawerModel = computed({
  get() {
    return props.modelValue
  },
  set(value) {
    emit('update:modelValue', value)
  }
})

const memberModel = computed(() => props.member)
const loading = ref(false)

const handleCancel = () => {
  emit('update:modelValue', false)
}

const handleSubmit = async () => {
  loading.value = true
  await MemberService.update(props.member.id, {
    username: memberModel.value.username,
    email: memberModel.value.email
  })
  await store.dispatch('member/doFind', props.member.id)
  Message.success('Member identities updated successfully')
  emit('update:modelValue', false)
}
</script>

<style lang="scss">
.identities-drawer {
  .el-form-item,
  .el-form-item__content {
    @apply mb-0;
  }
}
</style>
