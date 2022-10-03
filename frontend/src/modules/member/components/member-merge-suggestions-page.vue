<template>
  <div>
    <h1 class="app-content-title">Merging Suggestions</h1>
    <app-alert type="info" class="mb-4">
      <template #title
        >Why should I merge profiles?</template
      >
      <template #body>
        Community members come from different platforms and
        sources, so it's possible that the same person has
        multiple member profiles in Crowd.
        <br />
        To gather better insights from your community, we
        recommend you to look into these suggestions and
        validate if these profiles belong to the same person
        or not.
      </template>
    </app-alert>
    <div class="panel">
      <div v-if="membersToMerge.length > 0" class="-mx-6">
        <el-table
          ref="table"
          :data="membersToMerge"
          row-key="id"
        >
          <el-table-column label="Member A" min-width="25%">
            <template #default="scope">
              <router-link
                :to="{
                  name: 'memberView',
                  params: { id: scope.row[0].id }
                }"
                target="_blank"
                class="flex items-center"
              >
                <app-avatar
                  :entity="scope.row[0]"
                  size="sm"
                  class="mr-2"
                />
                <span class="font-semibold">{{
                  scope.row[0].displayName
                }}</span>
              </router-link>
            </template>
          </el-table-column>
          <el-table-column label="Member B" min-width="25%">
            <template #default="scope">
              <router-link
                :to="{
                  name: 'memberView',
                  params: { id: scope.row[1].id }
                }"
                target="_blank"
                class="flex items-center"
              >
                <app-avatar
                  :entity="scope.row[1]"
                  size="sm"
                  class="mr-2"
                />
                <span class="font-semibold">{{
                  scope.row[1].displayName
                }}</span>
              </router-link>
            </template>
          </el-table-column>
          <el-table-column>
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
          </el-table-column>
        </el-table>
      </div>
    </div>
  </div>
</template>

<script>
import { i18n } from '@/i18n'
import { MemberService } from '../member-service'

export default {
  name: 'AppMemberMergeSuggestionsPage',
  data() {
    return {
      membersToMerge: []
    }
  },
  async created() {
    this.membersToMerge =
      await MemberService.fetchMergeSuggestions()
  },
  methods: {
    async handleMergeClick(members) {
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
    },
    async handleNotMergeClick(members) {
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
  }
}
</script>
