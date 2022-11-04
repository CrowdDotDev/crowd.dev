<template>
  <div
    class="gap-x-4 px-6 grid md:grid-cols-6 lg:container lg:grid-cols-12 lg:px-8 text-gray-600"
  >
    <router-link
      class="text-gray-600 btn-link--md btn-link--secondary p-0 inline-flex items-center my-4"
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
        {{ count }} suggestions
      </p>
      <div
        v-for="(pair, index) in membersToMerge"
        :key="pair[0].id + '-' + pair[1].id"
        class="panel mb-6 !pb-0"
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
                  <el-button
                    class="btn btn-link btn-link--primary mr-4"
                    @click="makePrimary(pair)"
                  >
                    <i class="ri-arrow-left-right-line"></i>
                    <span>Make primary</span>
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
          <div
            class="flex flex-wrap w-full justify-between bg-gray-50 px-6 py-4"
          >
            <el-button
              class="btn btn--transparent btn--md flex items-center"
              @click="setViewingDetails(index)"
            >
              <i class="ri-eye-line text-lg"></i
              ><span>View details</span>
            </el-button>
            <div class="flex flex-wrap gap-3">
              <el-button
                class="btn btn--bordered btn--md"
                @click="handleNotMergeClick(pair)"
              >
                Ignore suggestion
              </el-button>
              <el-button
                class="btn btn--primary btn--md"
                @click="handleMergeClick(pair)"
              >
                Merge members
              </el-button>
            </div>

            <app-dialog
              v-model="viewingDetails[index]"
              title="Merging suggestion"
              size="2extra-large"
            >
              <template #actionBtn>
                <el-button
                  class="btn btn--bordered btn--md"
                  @click="handleNotMergeClick(pair)"
                >
                  Ignore suggestion
                </el-button>
                <el-button
                  class="btn btn--primary btn--md"
                  @click="handleMergeClick(pair)"
                >
                  Merge members
                </el-button>
              </template>
              <template #content>
                <div>
                  <member-merge-suggestions-details
                    :pair="pair"
                    @make-primary="makePrimary(pair)"
                  />
                </div>
              </template>
            </app-dialog>
          </div>
        </div>
      </div>
      <!-- Load more button -->
      <div
        v-if="isLoadMoreVisible"
        class="flex grow justify-center pt-4"
      >
        <div
          v-if="loading"
          v-loading="loading"
          class="app-page-spinner h-16 w-16 !relative !min-h-fit"
        ></div>
        <el-button
          v-else
          class="btn btn-link btn-link--primary"
          @click="onLoadMore"
          ><i class="ri-arrow-down-line"></i
          ><span class="text-xs">Load more</span></el-button
        >
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
import { ref, reactive, onMounted } from 'vue'
import AppMemberChannels from './../components/member-channels.vue'
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue'
import { MemberService } from '../member-service'
import MemberMergeSuggestionsDetails from '../components/suggestions/member-merge-suggestions-details.vue'
let membersToMerge = reactive([])
const channelsWidth = ref('')
const viewingDetails = ref({})
const limit = ref(20)
const loading = ref(false)
const count = ref(0)
const isLoadMoreVisible = ref(true)
let offset = ref(0)

onMounted(async () => {
  await onLoadMore()
  channelsWidth.value = getChannelsWidth(membersToMerge)

  const newViewingDetails = {}
  for (let i = 0; i < membersToMerge.length; i++) {
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
    await MemberService.merge(members[0], members[1])

    const index = membersToMerge.value.findIndex(
      (membersToMerge) => {
        return (
          membersToMerge[0].id === members[0].id &&
          membersToMerge[1].id
        )
      }
    )

    membersToMerge.value.splice(index, 1)
  } catch (error) {
    console.log(error)
    // no
  }
}
async function handleNotMergeClick(members) {
  try {
    await MemberService.addToNoMerge(members[0], members[1])

    const index = membersToMerge.value.findIndex(
      (membersToMerge) => {
        return (
          membersToMerge[0].id === members[0].id &&
          membersToMerge[1].id
        )
      }
    )

    membersToMerge.value.splice(index, 1)
  } catch (error) {
    // no
  }
}

async function onLoadMore() {
  loading.value = true
  const response =
    await MemberService.fetchMergeSuggestions(
      limit.value,
      offset.value
    )
  membersToMerge.push(...response.rows)
  count.value = response.count
  loading.value = false
  offset.value += limit.value
  isLoadMoreVisible.value =
    response.rows.length < limit.value
}

function makePrimary(members) {
  const newToMerge = []
  for (const ms of membersToMerge.value) {
    if (
      members[0].id === ms[0].id &&
      members[1].id === ms[1].id
    ) {
      newToMerge.push([ms[1], ms[0]])
    } else {
      newToMerge.push(ms)
    }
  }
  membersToMerge.value = newToMerge
}
</script>
