<template>
  <app-filter-dropdown
    module="member"
    :attributes="memberAttributes"
    :custom-attributes="customAttributes"
  />
</template>

<script>
export default {
  name: 'AppMemberListFilterDropdown'
}
</script>

<script setup>
import { MemberModel } from '@/modules/member/member-model'
import { useStore } from 'vuex'
import { onMounted, computed } from 'vue'
import StringField from '@/shared/fields/string-field'
import BooleanField from '@/shared/fields/boolean-field'
import IntegerField from '@/shared/fields/integer-field'
import DateField from '@/shared/fields/date-field'

const store = useStore()
const memberAttributes = Object.values(
  MemberModel.fields
).filter((f) => f.filterable)
const customAttributes = computed(() => {
  return (
    Object.values(store.state.member.customAttributes).map(
      (customAttribute) => {
        switch (customAttribute.type) {
          case 'boolean':
            return new BooleanField(
              customAttribute.name,
              customAttribute.label
            )
          case 'date':
            return new DateField(
              customAttribute.name,
              customAttribute.label
            )
          case 'number':
            return new IntegerField(
              customAttribute.name,
              customAttribute.label
            )

          default:
            return new StringField(
              customAttribute.name,
              customAttribute.label
            )
        }
      }
    ) || []
  )
})
onMounted(async () => {
  await store.dispatch('member/doFetchCustomAttributes')
})
</script>
