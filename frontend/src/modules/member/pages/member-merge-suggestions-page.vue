<template>
  <div
    class="gap-x-4 px-6 grid md:grid-cols-6 lg:container lg:grid-cols-12 lg:px-8 text-gray-600"
  >
    <router-link
      class="text-gray-600 btn-link--md btn-link--secondary p-0 flex items-center my-4"
      :to="{ path: '/members' }"
    >
      <i class="ri-arrow-left-s-line mr-2"></i
      >Members</router-link
    >
    <div class="col-start-1 col-end-13">
      <div class="mb-10">
        <div class="flex items-center justify-between">
          <h4>Merging suggestions</h4>
        </div>
        <div class="text-xs text-gray-600 max-w-3xl">
          crowd.dev is constantly checking your community
          for duplicate members. Here you can check all the
          merging suggestions.
        </div>
      </div>

      <p class="text-gray-500 text-sm mb-1">
        {{ membersToMerge.length }} suggestions
      </p>
      <div
        v-for="(pair, index) in membersToMerge"
        :key="pair[0].id + '-' + pair[1].id"
        class="panel mb-6"
      >
        <div class="-mx-6">
          <el-table ref="table" :data="pair" row-key="k1">
            <el-table-column label="Member" min-width="150">
              <template #default="scope">
                <div class="flex items-center">
                  <div class="h-12">
                    <app-avatar
                      :entity="scope.row"
                      size="sm"
                      class="mr-2"
                    />
                  </div>
                  <div class="h-12 text-gray-900">
                    <div>{{ scope.row.displayName }}</div>
                    <div
                      v-if="scope.row.attributes.bio"
                      class="text-gray-500 text-xs pr-4"
                    >
                      {{ scope.row.attributes.bio.default }}
                    </div>
                    <div
                      v-else
                      class="text-gray-500 text-xs pr-4"
                    >
                      -
                    </div>
                  </div>
                </div>
              </template>
            </el-table-column>
            <el-table-column
              label="Organization & Title"
              width="250"
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
            <el-table-column>
              <template #default="scope">
                <div
                  v-if="scope.row.id === pair[1].id"
                  class="flex items-center justify-end"
                >
                  <button
                    class="btn bg-transparent mr-4"
                    @click="makePrimary(pair)"
                  >
                    <i
                      class="ri-arrow-left-right-line ri-lg text-brand-600"
                    ></i>
                    <span class="text-brand-600 text-xs"
                      >Make primary</span
                    >
                  </button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div
            class="flex flex-wrap w-full justify-between"
          >
            <button
              class="btn merge-suggestion-button btn--transparent mx-4"
              @click="setViewingDetails(index)"
            >
              <i class="ri-eye-line mr-1"></i> View details
            </button>
            <div class="flex flex-wrap">
              <button
                class="btn btn--bordered merge-suggestion-button"
                @click="handleNotMergeClick(pair)"
              >
                Ignore suggestion
              </button>
              <button
                class="btn btn--primary merge-suggestion-button mx-4"
                @click="handleMergeClick(pair)"
              >
                Merge members
              </button>
            </div>
            <el-dialog
              v-model="viewingDetails[index]"
              title="Merge suggestion"
              :append-to-body="true"
              :close-on-click-modal="false"
              :show-close="false"
              :destroy-on-close="true"
              class="el-dialog--2xl"
              @close="viewingDetails[index] = false"
            >
              <template
                #header="{ close, titleId, titleClass }"
              >
                <div class="details-header">
                  <h3 :id="titleId" :class="titleClass">
                    Merging suggestion
                  </h3>
                  <div class="flex items-center">
                    <button
                      class="btn btn--bordered merge-suggestion-button header-merge-suggestion-button"
                      @click="handleNotMergeClick(pair)"
                    >
                      Ignore suggestion
                    </button>
                    <button
                      class="btn btn--primary mx-4 merge-suggestion-button header-merge-suggestion-button"
                      @click="handleMergeClick(pair)"
                    >
                      Merge members
                    </button>
                    <button class="btn" @click="close">
                      <i
                        class="ri-close-line ri-lg text-gray-400"
                      ></i>
                    </button>
                  </div>
                </div>
              </template>
              <div>
                <member-merge-suggestions-details
                  :pair="pair"
                  @make-primary="makePrimary(pair)"
                />
              </div>
            </el-dialog>
          </div>
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
import AppMemberChannels from './../components/member-channels.vue'
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue'
import { MemberService } from '../member-service'
import MemberMergeSuggestionsDetails from '../components/member-merge-suggestions-details.vue'
const membersToMerge = ref([])
const channelsWidth = ref('')
const viewingDetails = ref({})

onMounted(async () => {
  membersToMerge.value =
    await MemberService.fetchMergeSuggestions()

  channelsWidth.value = getChannelsWidth(
    membersToMerge.value
  )

  const newViewingDetails = {}
  for (let i = 0; i < membersToMerge.value.length; i++) {
    newViewingDetails[i] = false
  }
  viewingDetails.value = newViewingDetails
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

function setViewingDetails(index) {
  viewingDetails.value[index] = true
}

async function handleMergeClick(members) {
  try {
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
    console.log(error)
    // no
  }
}
async function handleNotMergeClick(members) {
  try {
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

function makePrimary(members) {
  const newToMerge = []
  for (const ms of this.membersToMerge) {
    if (
      members[0].id === ms[0].id &&
      members[1].id === ms[1].id
    ) {
      newToMerge.push([ms[1], ms[0]])
    } else {
      newToMerge.push(ms)
    }
  }
  this.membersToMerge = newToMerge
}
</script>
<style scoped lang="scss">
.line-clamp {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  text-overflow: ellipsis;
}

.merge-suggestion-button {
  @apply mt-4 px-2 text-sm py-2;
}

.header-merge-suggestion-button {
  @apply mt-0;
}

.details-header {
  @apply flex justify-between items-center;
}
</style>
