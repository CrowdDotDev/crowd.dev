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
      <div
        v-for="pair in membersToMerge"
        :key="pair[0].id + '-' + pair[1].id"
        class="-mx-6"
      >
        <el-table
          ref="table"
          :data="membersToMerge[0]"
          row-key="k1"
        >
          <el-table-column label="Member" min-width="25%">
            <template #default="scope">
              <div class="flex items-center relative">
                <div class="h-16">
                  <app-avatar
                    :entity="scope.row"
                    size="sm"
                    class="mr-2"
                  />
                </div>
                <div class="h-16 text-black">
                  <div>{{ scope.row.displayName }}</div>
                  <div
                    v-if="scope.row.attributes.bio"
                    class="text-gray-400 text-xs pr-4 line-clamp"
                  >
                    {{ scope.row.attributes.bio.default }}
                  </div>
                  <div
                    v-else
                    class="text-gray-400 text-xs pr-4"
                  >
                    -
                  </div>
                </div>
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
        <div class="flex flex-wrap">
          <button
            class="btn btn--transparent mt-4 px-2 text-xs py-3"
            @click="setViewingDetails(pair[0], pair[1])"
          >
            View details
          </button>
          <button
            class="btn btn--bordered mt-4 px-2 text-xs py-3"
            @click="handleNotMergeClick(pair)"
          >
            Ignore suggestion
          </button>
          <button
            class="btn btn--primary mt-4 px-2 text-xs py-3"
            @click="handleMergeClick(pair)"
          >
            Merge members
          </button>
          <el-dialog
            v-model="viewingDetails.viewing"
            title="New Member"
            :append-to-body="true"
            :close-on-click-modal="false"
            :destroy-on-close="true"
            custom-class="el-dialog--lg"
            @close="viewingDetails.viewing = false"
          >
            <div>
              {{ JSON.stringify(pair) }}
            </div>
          </el-dialog>
        </div>
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
import { i18n } from '@/i18n'
import AppMemberChannels from './member-channels'
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue'
import { MemberService } from '../member-service'

const membersToMerge = ref([])
const channelsWidth = ref('')
const viewingDetails = ref({
  viewing: false,
  m1: {},
  m2: {}
})

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

function setViewingDetails(m1, m2) {
  viewingDetails.value = {
    viewing: true,
    m1,
    m2
  }
}

async function handleMergeClick(members) {
  try {
    await this.$myConfirm(
      i18n('common.areYouSure'),
      i18n('common.confirm'),
      {
        confirmButtonText: i18n('common.yes'),
        cancelButtonText: i18n('common.no'),
        type: 'warning'
      }
    )

    const response = await MemberService.merge(
      members[0],
      members[1]
    )

    const index = this.membersToMerge.findIndex(
      (membersToMerge) => {
        return (
          membersToMerge[0].id === members[0].id &&
          membersToMerge[1].id
        )
      }
    )

    this.membersToMerge.splice(index, 1)

    console.log(response)
  } catch (error) {
    // no
  }
}
async function handleNotMergeClick(members) {
  try {
    await this.$myConfirm(
      i18n('common.areYouSure'),
      i18n('common.confirm'),
      {
        confirmButtonText: i18n('common.yes'),
        cancelButtonText: i18n('common.no'),
        type: 'warning'
      }
    )

    const response = await MemberService.addToNoMerge(
      members[0],
      members[1]
    )

    const index = this.membersToMerge.findIndex(
      (membersToMerge) => {
        return (
          membersToMerge[0].id === members[0].id &&
          membersToMerge[1].id
        )
      }
    )

    this.membersToMerge.splice(index, 1)

    console.log(response)
  } catch (error) {
    // no
  }
}
</script>
<style scoped>
.line-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}
</style>
