<template>
  <div>
    <app-drawer
      v-model="isExpanded"
      :size="600"
      :has-border="true"
      title="Conversation"
    >
      <template #header-label>
        <div
          class="badge"
          :class="
            conversation.published ? 'badge--green' : ''
          "
        >
          {{
            conversation.published
              ? 'Published'
              : 'Unpublished'
          }}
        </div></template
      >
      <template #content>
        <app-conversation-details
          v-if="loadingFind"
          :loading="true"
        />
        <div v-else>
          <app-conversation-details
            v-if="conversation"
            :editing="true"
            :conversation="conversation"
            @edit-title="handleEditTitle"
          />
          <div v-else>
            <div class="flex justify-center pt-4">
              <i
                class="ri-question-answer-line text-4xl h-12 text-gray-300"
              ></i>
            </div>
            <p
              class="text-xs leading-5 text-center italic text-gray-400 pt-4 pb-12"
            >
              There was an error loading conversation
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div>
          <el-button
            v-if="conversation.published"
            class="btn btn--md btn--bordered mr-4"
            :disabled="
              loadingUpdate || isEditLockedForSampleData
            "
            :loading="loadingUpdate"
            @click="handleTogglePublished"
          >
            <i class="ri-lg ri-arrow-go-back-line mr-2"></i>
            Unpublish conversation
          </el-button>
          <el-button
            v-if="!conversation.published"
            class="btn btn--md btn--primary"
            :disabled="
              loadingUpdate || isEditLockedForSampleData
            "
            :loading="loadingUpdate"
            @click="handleTogglePublished"
          >
            <i
              class="ri-lg ri-upload-cloud-2-line mr-2"
            ></i>
            Publish conversation
          </el-button>
        </div>
      </template>
    </app-drawer>

    <app-dialog v-model="editingTitle" title="Edit title">
      <template #content>
        <div class="px-6 pb-6">
          <el-input v-model="titleToUpdate"></el-input>
        </div>
        <div
          class="bg-gray-50 rounded-b-md flex items-center justify-end py-4 px-6"
        >
          <el-button
            class="btn btn--bordered btn--md mr-3"
            @click="handleCancelEditTitle"
            >Cancel</el-button
          >
          <el-button
            class="btn btn--primary btn--md"
            @click="handleSubmitEditTitle"
            >Submit</el-button
          >
        </div>
      </template>
    </app-dialog>
  </div>
</template>

<script>
export default {
  name: 'AppCommunityHelpCenterConversationDrawer'
}
</script>
<script setup>
import {
  mapActions,
  mapGetters
} from '@/shared/vuex/vuex.helpers'
import {
  defineEmits,
  defineProps,
  watch,
  reactive,
  ref,
  computed
} from 'vue'
import { ConversationService } from '@/modules/conversation/conversation-service'
import AppConversationDetails from '@/modules/conversation/components/conversation-details'
import { ConversationPermissions } from '@/modules/conversation/conversation-permissions'

const props = defineProps({
  conversationId: {
    type: String,
    required: false,
    default: ''
  },
  expanded: {
    type: Boolean,
    required: false,
    default: false
  }
})
const emit = defineEmits(['close'])

const { doPublish, doUnpublish, doUpdate } = mapActions(
  'communityHelpCenter'
)
const { currentTenant, currentUser } = mapGetters('auth')

const isExpanded = computed({
  get() {
    return props.expanded
  },
  set(value) {
    if (!value) {
      return emit('close')
    }
  }
})

const isEditLockedForSampleData = computed(() => {
  return new ConversationPermissions(
    currentTenant.value,
    currentUser.value
  ).editLockedForSampleData
})

const loadingFind = ref(false)
const loadingUpdate = ref(false)
const editingTitle = ref(false)
const titleToUpdate = ref(null)
const conversation = reactive({})

watch(
  () => props.conversationId,
  async (newValue) => {
    if (newValue) {
      loadingFind.value = true
      Object.assign(
        conversation,
        await ConversationService.find(props.conversationId)
      )
      titleToUpdate.value = conversation.title
      loadingFind.value = false
    } else {
      titleToUpdate.value = null
    }
  }
)

watch(
  () => isExpanded.value,
  (newValue) => {
    if (newValue) {
      window.analytics.track(
        'Community Help Center Conversation Drawer Opened'
      )
    }
  }
)

const handleTogglePublished = async () => {
  loadingUpdate.value = true
  if (conversation.published === true) {
    await doUnpublish({ id: conversation.id })
    conversation.published = false
  } else {
    await doPublish({ id: conversation.id })
    conversation.published = true
  }
  loadingUpdate.value = false
}

const handleEditTitle = async () => {
  editingTitle.value = true
}

const handleCancelEditTitle = async () => {
  editingTitle.value = false
}
const handleSubmitEditTitle = async () => {
  const { title } = await doUpdate({
    id: conversation.id,
    values: {
      title: titleToUpdate.value
    }
  })
  conversation.title = title
  editingTitle.value = false
}
</script>
