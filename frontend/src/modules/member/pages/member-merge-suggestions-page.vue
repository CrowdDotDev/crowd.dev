<template>
  <app-page-wrapper size="narrow">
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

      <!-- Loading -->
      <div v-if="loading && membersToMerge?.length === 0">
        <div
          class="flex items-center justify-center w-full"
        >
          <div
            v-loading="loading"
            class="app-page-spinner h-16 w-16 !relative !min-h-fit"
          ></div>
        </div>
      </div>

      <!-- Merging suggestions list -->
      <div v-else-if="!!membersToMerge.length">
        <p class="text-gray-500 text-sm mb-2">
          {{ count }} suggestions
        </p>
        <div
          v-for="(pair, index) in membersToMerge"
          :key="pair[0].id + '-' + pair[1].id"
          class="panel mb-6 !pb-0"
        >
          <div class="-mx-6">
            <el-table ref="table" :data="pair" row-key="k1">
              <el-table-column
                label="Member"
                min-width="150"
              >
                <template #default="scope">
                  <div class="flex items-start">
                    <div class="min-h-12">
                      <app-avatar
                        :entity="scope.row"
                        size="sm"
                        class="mr-2 mt-0.5"
                      />
                    </div>
                    <div class="min-h-12 text-gray-900">
                      <app-member-display-name
                        :member="scope.row"
                      />
                      <div
                        v-if="scope.row.attributes.bio"
                        class="text-gray-500 text-xs pr-4"
                      >
                        {{
                          scope.row.attributes.bio.default
                        }}
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
                      :disabled="isEditLockedForSampleData"
                      @click="makePrimary(index)"
                    >
                      <i
                        class="ri-arrow-left-right-line"
                      ></i>
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
                  :disabled="isEditLockedForSampleData"
                  @click="handleNotMergeClick(pair)"
                >
                  Ignore suggestion
                </el-button>
                <el-button
                  class="btn btn--primary btn--md"
                  :disabled="isEditLockedForSampleData"
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
                    :disabled="isEditLockedForSampleData"
                    @click="handleNotMergeClick(pair)"
                  >
                    Ignore suggestion
                  </el-button>
                  <el-button
                    class="btn btn--primary btn--md"
                    :disabled="isEditLockedForSampleData"
                    @click="handleMergeClick(pair)"
                  >
                    Merge members
                  </el-button>
                </template>
                <template #content>
                  <div>
                    <member-merge-suggestions-details
                      :pair="pair"
                      @make-primary="makePrimary(index)"
                    />
                  </div>
                </template>
              </app-dialog>
            </div>
          </div>
        </div>
      </div>
      <div v-else>
        <p class="text-gray-500 text-sm mb-2">
          0 suggestions
        </p>
      </div>

      <!-- Load more button -->
      <div
        v-if="isLoadMoreVisible && !!membersToMerge?.length"
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
  </app-page-wrapper>
</template>

<script>
export default {
  name: 'AppMemberMergeSuggestionsPage'
}
</script>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import AppMemberChannels from './../components/member-channels.vue'
import AppMemberOrganizations from '@/modules/member/components/member-organizations.vue'
import { MemberService } from '../member-service'
import MemberMergeSuggestionsDetails from '../components/suggestions/member-merge-suggestions-details.vue'
import AppMemberDisplayName from '@/modules/member/components/member-display-name'
import Message from '@/shared/message/message'
import { MemberPermissions } from '../member-permissions'
import { mapGetters } from '@/shared/vuex/vuex.helpers'

const { currentTenant, currentUser } = mapGetters('auth')

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

const isEditLockedForSampleData = computed(() => {
  return new MemberPermissions(
    currentTenant.value,
    currentUser.value
  ).editLockedForSampleData
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

    Message.success('Members merged successfuly')

    await onFetch()
  } catch (error) {
    console.log(error)

    Message.error('There was an error merging members')
  }
}
async function handleNotMergeClick(members) {
  try {
    await MemberService.addToNoMerge(members[0], members[1])

    Message.success(
      'Merging suggestion ignored successfuly'
    )

    await onFetch()
  } catch (error) {
    Message.error(
      'There was an error ignoring the merging suggestion'
    )
  }
}

async function onLoadMore() {
  try {
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
      response.rows.length === limit.value
  } catch (e) {
    Message.error(
      'There was an error loading the merging suggestions'
    )
  }
}

async function onFetch() {
  // Reset
  loading.value = true
  membersToMerge.splice(0, membersToMerge.length)
  count.value = 0
  offset.value = 0

  await onLoadMore()
}

function makePrimary(index) {
  const newToMerge = []

  for (const ms of membersToMerge[index]) {
    newToMerge.unshift(ms)
  }

  membersToMerge.splice(index, 1, newToMerge)
}
</script>
