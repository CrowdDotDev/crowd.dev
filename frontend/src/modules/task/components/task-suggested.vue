<template>
  <section class="panel px-5 pb-3">
    <div class="pb-6">
      <div class="flex items-center">
        <div
          class="h-6 w-6 rounded-md bg-purple-50 flex items-center justify-center"
        >
          <div
            class="ri-lightbulb-line text-sm h-4 flex items-center text-purple-500"
          ></div>
        </div>
        <h6 class="text-base leading-6 font-semibold pl-3">
          Suggestions
        </h6>
      </div>
    </div>
    <div class="-mx-5">
      <article
        v-for="task of incompleteTasks"
        :key="task.id"
        class="px-5 pt-4 pb-5 border-t border-gray-100"
      >
        <h6 class="text-2xs font-semibold leading-4.5 pb-1">
          {{ task.title }}
        </h6>
        <p class="text-xs leading-5 text-gray-600 pb-5">
          {{ task.description }}
        </p>
        <el-button
          class="btn btn--secondary btn--sm !py-2.5 w-full"
          @click="addTask(task)"
        >
          Add task
        </el-button>
      </article>
    </div>
  </section>
</template>

<script>
export default {
  name: 'AppTaskSuggested'
}
</script>

<script setup>
import { computed, ref } from 'vue'
import {
  mapActions,
  mapGetters
} from '@/shared/vuex/vuex.helpers'
import { MemberService } from '@/modules/member/member-service'
import moment from 'moment'

const { currentUser } = mapGetters('auth')
const { editTask } = mapActions('task')

const fetchInfluentalMembers = () =>
  MemberService.list(
    {
      and: [
        { isTeamMember: { not: true } },
        {
          joinedAt: {
            gt: moment().subtract(30, 'day').toISOString()
          }
        },
        {
          reach: { gt: 10000 }
        }
      ]
    },
    'joinedAt_DESC',
    2,
    0,
    false
  ).then(({ rows }) => ({ members: rows }))

const fetchPoorlyEngagedMembers = () => {
  return MemberService.list(
    {
      and: [
        { isTeamMember: { not: true } },
        {
          lastActive: {
            lt: moment().subtract(30, 'day').toISOString()
          }
        }
      ]
    },
    'lastActive_DESC',
    2,
    0,
    false
  ).then(({ rows }) => ({ members: rows }))
}

const suggestedTasks = ref([
  {
    id: 'engage',
    title: 'Engage with relevant content',
    description:
      'Engage with at least 5 posts on Eagle today'
  },
  {
    id: 'influential-member',
    title: 'Reach out to influential members',
    description:
      'Connect with new members with over 10k followers',
    mapData: fetchInfluentalMembers
  },
  {
    id: 'poorly-engaged',
    title: 'Reach out to poorly engaged members',
    description:
      'Connect with members with low activity in the last 30 days',
    mapData: fetchPoorlyEngagedMembers
  },
  {
    id: 'negative-reactions',
    title: 'Check for negative reactions',
    description:
      'React to activities with very negative sentiment'
  },
  {
    id: 'workspace-integrations',
    title: 'Setup your workpace integrations',
    description:
      'Connect with at least 2 data sources that are relevant to your community'
  },
  {
    id: 'team-setup',
    title: 'Setup your team',
    description:
      'Invite colleagues to your community workspace'
  }
])

const addTask = (task) => {
  let call = () => Promise.resolve({})
  if (task.mapData) {
    call = task.mapData
  }
  call().then((data) => {
    editTask({
      name: task.title,
      body: task.description,
      assignees: [currentUser],
      ...data
    })
  })
}

const incompleteTasks = computed(() => suggestedTasks.value)
</script>
