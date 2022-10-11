<template>
  <div>
    <div class="mb-10">
      <div class="flex items-center justify-between">
        <h4>Merging suggestions</h4>
      </div>
      <div class="text-xs text-gray-500 max-w-lg">
        crowd.dev is constantly checking your community for
        duplicate members. <br />Here you can check all the
        merging suggestions.
      </div>
    </div>

    <div class="panel">
      <div v-if="membersToMerge.length > 0" class="-mx-6">
        <el-table
          ref="table"
          :data="membersToMerge[0]"
          row-key="k1"
        >
          <el-table-column label="Member" min-width="25%">
            <template #default="scope">
              <div class="flex items-center">
                <app-avatar
                  :entity="scope.row"
                  size="sm"
                  class="mr-2"
                />
                <span class="font-semibold">{{
                  scope.row.displayName
                }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column
            label="Organization & Title"
            width="220"
          >
            <template #default="scope">
              <app-member-organizations
                :member="scope.row"
              />
            </template>
          </el-table-column>
          <el-table-column
            label="Identities"
            :width="channelsWidth"
          >
            <template #default="scope">
              <app-member-channels
                :member="scope.row"
              ></app-member-channels>
            </template>
          </el-table-column>
          <!-- <el-table-column>
            <template #default="scope">
              <div class="flex items-center justify-end">
                <button
                  class="btn btn--secondary mr-4"
                  @click="handleMergeClick(scope.row)"
                >
                  <i class="ri-group-line ri-lg"></i>
                  Merge profiles
                </button>
                <router-link
                  :to="{
                    name: 'memberMerge',
                    params: { id: scope.row[0].id },
                    query: {
                      idToMerge: scope.row[1].id,
                      fromSuggestion: true
                    }
                  }"
                  class="btn btn--secondary mr-4"
                  target="_blank"
                  ><i
                    class="ri-external-link-line ri-lg"
                  ></i
                  >Open merge page</router-link
                >
                <span
                  class="block text-brand-500 hover:opacity-50 cursor-pointer"
                  @click="handleNotMergeClick(scope.row)"
                >
                  Not the same person
                </span>
              </div>
            </template>
          </el-table-column> -->
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'AppMemberMergeSuggestionsPage'
}
</script>

<script setup>
import { ref, onMounted } from 'vue'
import AppMemberChannels from './member-channels'
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue'
import { MemberService } from '../member-service'

const membersToMerge = ref([])
const channelsWidth = ref('')

onMounted(async () => {
  membersToMerge.value =
    await MemberService.fetchMergeSuggestions()

  channelsWidth.value = getChannelsWidth(
    membersToMerge.value
  )
})

/**
 * Find the width of the channels column. Get the member with the most channels,
 * and return the width of the column based on the number of channels.
 * @param {string} membersToMerge List of pairs of members to merge
 * @returns {string} Width of the channels column
 */
function getChannelsWidth(membersToMerge) {
  const maxChannels = membersToMerge.reduce((acc, item) => {
    const m0Channels = Object.keys(item[0].username).length
    const m1Channels = Object.keys(item[1].username).length
    const max = Math.max(m0Channels, m1Channels)
    return Math.max(acc, max)
  }, 0)

  return `${90 + maxChannels * 32}px`
}

// async function handleMergeClick(members) {
//   try {
//     await this.$myConfirm(
//       i18n('common.areYouSure'),
//       i18n('common.confirm'),
//       {
//         confirmButtonText: i18n('common.yes'),
//         cancelButtonText: i18n('common.no'),
//         type: 'warning'
//       }
//     )

//     const response = await MemberService.merge(
//       members[0],
//       members[1]
//     )

//     const index = this.membersToMerge.findIndex(
//       (membersToMerge) => {
//         return (
//           membersToMerge[0].id === members[0].id &&
//           membersToMerge[1].id
//         )
//       }
//     )

//     this.membersToMerge.splice(index, 1)

//     console.log(response)
//   } catch (error) {
//     // no
//   }
// }
// async function handleNotMergeClick(members) {
//   try {
//     await this.$myConfirm(
//       i18n('common.areYouSure'),
//       i18n('common.confirm'),
//       {
//         confirmButtonText: i18n('common.yes'),
//         cancelButtonText: i18n('common.no'),
//         type: 'warning'
//       }
//     )

//     const response = await MemberService.addToNoMerge(
//       members[0],
//       members[1]
//     )

//     const index = this.membersToMerge.findIndex(
//       (membersToMerge) => {
//         return (
//           membersToMerge[0].id === members[0].id &&
//           membersToMerge[1].id
//         )
//       }
//     )

//     this.membersToMerge.splice(index, 1)

//     console.log(response)
//   } catch (error) {
//     // no
//   }
// }
</script>
