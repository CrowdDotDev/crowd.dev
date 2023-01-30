<template>
  <div class="flex flex-col gap-6">
    <!-- Member enrichment -->
    <app-member-enrichment
      v-if="!member.lastEnriched"
      :member="member"
    />

    <div class="member-view-aside panel">
      <app-member-aside-identities :member="member" />
      <app-member-aside-custom-attributes
        :member="member"
        class="mt-10"
      />
      <app-member-aside-enriched
        :member="member"
        class="mt-10"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppMemberViewAside'
}
</script>

<script setup>
import { defineProps } from 'vue'
import AppMemberEnrichment from '@/modules/member/components/member-enrichment'
import AppMemberAsideCustomAttributes from './_aside/_aside-custom-attributes'
import AppMemberAsideIdentities from './_aside/_aside-identities'
import AppMemberAsideEnriched from './_aside/_aside-enriched'

defineProps({
  member: {
    type: Object,
    default: () => {}
  }
})
</script>
