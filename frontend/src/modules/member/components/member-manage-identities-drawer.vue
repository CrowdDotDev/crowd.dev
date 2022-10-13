<template>
  <el-drawer
    v-model="drawerModel"
    size="600px"
    title="Manage identities"
  >
    <el-form :model="memberModel">
      <MemberFormIdentities
        v-model="memberModel"
        :show-header="false"
      />
    </el-form>
    <template #footer>
      <div style="flex: auto">
        <el-button
          class="btn btn--secondary btn--md mr-3"
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
  </el-drawer>
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
import MemberFormIdentities from './member-form-identities'
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
    username: memberModel.value.username
  })
  await store.dispatch('member/doFind', props.member.id)
  Message.success('Member identities updated successfully')
  emit('update:modelValue', false)
}
</script>
