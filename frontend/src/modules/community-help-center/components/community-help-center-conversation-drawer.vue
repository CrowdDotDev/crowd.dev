<template>
  <div>
    <el-drawer
      v-model="isExpanded"
      :show-close="false"
      :close-on-click-modal="false"
      :size="600"
    >
      <template #header>
        <div
          class="flex justify-between items-center border-b border-gray-200 -mb-4 -mx-6 px-6 pb-6"
        >
          <h2 class="text-lg font-medium text-gray-1000">
            Conversation
          </h2>
          <div class="flex items-center">
            <div
              class="badge mr-6"
              :class="
                conversation.published ? 'badge--green' : ''
              "
            >
              {{
                conversation.published
                  ? 'Published'
                  : 'Unpublished'
              }}
            </div>
            <button
              type="button"
              class="btn btn--transparent btn--md w-10"
              @click="$emit('close')"
            >
              <i
                class="ri-xl w-4 h-4 ri-close-line flex items-center justify-center"
              ></i>
            </button>
          </div>
        </div>
      </template>
      <template #default>
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
            :disabled="loadingUpdate"
            :loading="loadingUpdate"
            @click="handleTogglePublished"
          >
            <i class="ri-lg ri-arrow-go-back-line mr-2"></i>
            Unpublish conversation
          </el-button>
          <el-button
            v-if="!conversation.published"
            class="btn btn--md btn--primary"
            :disabled="loadingUpdate"
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
    </el-drawer>
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
import { mapActions } from '@/shared/vuex/vuex.helpers'
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

const { doPublish, doUnpublish, doUpdate } = mapActions(
  'communityHelpCenter'
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
