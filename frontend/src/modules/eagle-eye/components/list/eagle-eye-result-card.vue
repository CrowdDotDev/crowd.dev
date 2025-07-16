<template>
  <div
    class="bg-white panel-card px-5 pt-5 pb-4 h-fit"
    :class="{
      'hover:shadow-md hover:cursor-pointer': result.url,
    }"
    @click="onCardClick"
  >
    <!-- Header -->
    <div
      class="flex items-center justify-between pb-4 border-b border-gray-100"
    >
      <img
        :alt="platformOptions[result.platform].label"
        :src="platformOptions[result.platform].img"
        class="min-w-6 h-6"
      />
      <span v-if="result.postedAt" class="text-gray-400 text-2xs">{{
        formatDateToTimeAgo(result.postedAt)
      }}</span>
    </div>

    <!-- Image -->
    <div
      v-if="result.post.thumbnail"
      class="rounded w-full overflow-hidden flex mt-4 aspect-video"
    >
      <app-image
        class="w-full aspect-video"
        :src="result.post.thumbnail"
        :alt="result.post.title"
      />
    </div>

    <!-- Title & description -->
    <div
      class="mt-4 pb-9"
      :class="{
        'border-b border-gray-100': hasPermission(
          LfPermission.eagleEyeActionCreate,
        ),
      }"
    >
      <div
        v-if="result.platform === 'twitter'"
        class="text-sm text-gray-900 break-words"
      >
        {{ result.post.description }}
      </div>
      <div v-else>
        <a
          v-if="subreddit"
          class="text-xs mb-1 font-medium leading-6 hover:underline"
          target="_blank"
          rel="noopener noreferrer"
          :href="`https://www.reddit.com/${subreddit}`"
        >
          {{ subreddit }}
        </a>
        <h6 v-if="result.post.title" class="black mb-3 break-words">
          {{ result.post.title }}
        </h6>
        <div
          class="eagle-eye-result-content text-gray-600 text-xs line-clamp-4 break-words"
        >
          {{ result.post.description }}
        </div>
      </div>
    </div>

    <!-- Actions footer -->
    <span
      v-if="hasPermission(LfPermission.eagleEyeActionCreate)"
      class="text-gray-400 text-3xs mt-2 mb-1"
    >Rate this content</span>
    <div
      v-if="hasPermission(LfPermission.eagleEyeActionCreate)"
      class="flex items-center justify-between gap-2"
    >
      <div class="flex items-center gap-1">
        <el-tooltip placement="top" content="Relevant">
          <span @click.stop>
            <div
              class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 group"
              :class="{
                'bg-green-100 hover:bg-green-100': isRelevant,
              }"
              @click.stop="
                onActionClick({
                  actionType: 'thumbs-up',
                  shouldAdd: !isRelevant,
                })
              "
            >
              <lf-icon
                name="thumbs-up"
                :type="isRelevant ? 'solid' : 'light'"
                :size="20"
                class="group-hover:text-gray-900"
                :class="
                  isRelevant
                    ? 'text-green-600 group-hover:text-green-600'
                    : 'text-gray-400'
                "
              />
            </div>
          </span>
        </el-tooltip>

        <el-tooltip placement="top" content="Not relevant">
          <span @click.stop>
            <div
              class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 group"
              :class="{
                'bg-red-100 hover:bg-red-100': isNotRelevant,
              }"
              @click.stop="
                onActionClick({
                  actionType: 'thumbs-down',
                  shouldAdd: !isNotRelevant,
                })
              "
            >
              <lf-icon
                name="thumbs-down"
                :type="isNotRelevant ? 'solid' : 'light'"
                :size="20"
                class="group-hover:text-gray-900"
                :class="
                  isNotRelevant
                    ? 'text-red-600 group-hover:text-red-600'
                    : 'text-gray-400'
                "
              />
            </div>
          </span>
        </el-tooltip>
      </div>
      <div class="flex flex-wrap">
        <el-tooltip placement="top" :content="replyTooltip">
          <span
            v-if="areGeneratedRepliesActivated"
            @click.stop="onGenerateReplyClick"
          >
            <div
              class="h-8 w-8 flex items-center mr-2 justify-center rounded-full group"
              :class="{
                'hover:bg-gray-200': isGenerateReplyAvailable,
                'hover:bg-white': !isGenerateReplyAvailable,
                'cursor-auto': !isGenerateReplyAvailable,
              }"
            >
              <lf-icon
                name="lightbulb"
                :size="20"
                :class="
                  isGenerateReplyAvailable
                    ? 'text-gray-400 group-hover:text-gray-900'
                    : 'text-gray-300'
                "
              />
            </div>
          </span>
        </el-tooltip>
        <lf-modal v-model="replyDialogVisible" :header-title="DialogHeading">
          <div>
            <div class="flex items-center gap-3 w-full rounded-b-lg px-6 pt-0">
              <div
                class="rounded-full bg-yellow-100 flex items-center justify-center min-h-6 min-w-[1.6rem]"
              >
                <lf-icon
                  name="circle-exclamation"
                  :size="16"
                  class="text-yellow-500"
                />
              </div>
              <div class="text-gray-600 text-2xs">
                This is just a starting point. We recommend you to read the post
                and add genuine value to your response.
              </div>
            </div>
            <div class="p-4 flex items-center justify-center flex-wrap">
              <div class="bg-gray-50 rounded-lg w-full">
                <Transition name="fade-out-in" mode="out-in">
                  <div
                    v-if="generatedReply === ''"
                    class="mx-auto text-center w-full p-4"
                  >
                    <div class="flex flex-col gap-3 w-3/4">
                      <div
                        v-for="(_, dindex) in [1, 2, 3]"
                        :key="dindex"
                        class="bg-gray-200 h-3 w-full rounded animate-pulse"
                        :class="{
                          'w-11/12': dindex === 1,
                        }"
                      />
                    </div>
                  </div>
                  <div v-else class="mx-auto">
                    <div
                      class="h-full w-full cursor-copy p-4"
                      @click="copyToClipboard(generatedReply)"
                    >
                      {{ generatedReply }}
                    </div>
                  </div>
                </Transition>
              </div>
              <div
                class="flex justify-between items-center mt-4 px-2 h-8 w-full"
              >
                <Transition name="fade">
                  <div
                    v-if="generatedReply !== ''"
                    class="text-xs text-gray-400 flex items-center"
                  >
                    <span>Was this helpful? </span>
                    <lf-icon
                      name="thumbs-up"
                      :type="generatedReplyThumbsUpFeedback ? 'solid' : 'light'"
                      :size="16"
                      class="cursor-pointer mx-1"
                      :class="
                        generatedReplyThumbsUpFeedback ? 'text-green-500' : ''
                      "
                      @click="
                        generatedReplyFeedback(generatedReply, 'thumbs-up')
                      "
                    />
                    <lf-icon
                      name="thumbs-down"
                      :type="
                        generatedReplyThumbsDownFeedback ? 'solid' : 'light'
                      "
                      :size="16"
                      class="cursor-pointer"
                      :class="
                        generatedReplyThumbsDownFeedback ? 'text-red-500' : ''
                      "
                      @click="
                        generatedReplyFeedback(generatedReply, 'thumbs-down')
                      "
                    />
                  </div>
                </Transition>
                <Transition name="fade">
                  <div v-if="generatedReply !== ''">
                    <Transition name="slide" mode="out-in">
                      <div
                        v-if="replyInClipboard"
                        class="flex flex-wrap items-center"
                      >
                        <lf-icon
                          name="check"
                          :size="16"
                          class="text-primary-500"
                        />
                        <span class="text-xs ml-1 text-gray-600">Copied to clipboard.
                          <span
                            class="font-semibold cursor-pointer text-primary-500"
                            @click="onCardClickFromDialog"
                          >
                            Go to post.
                          </span>
                        </span>
                      </div>
                      <div v-else class="copy-icon group">
                        <el-tooltip placement="top" content="Copy to clipboard">
                          <lf-icon
                            name="clipboard"
                            :size="20"
                            @click="copyToClipboard(generatedReply)"
                          />
                        </el-tooltip>
                      </div>
                    </Transition>
                  </div>
                </Transition>
              </div>
            </div>
          </div>
        </lf-modal>
        <el-tooltip placement="top" :content="bookmarkTooltip">
          <span
            :class="{
              '!cursor-auto': isBookmarkedByTeam,
            }"
            @click.stop="onGenerateReplyClick"
          >
            <div
              class="h-8 w-8 flex items-center justify-center rounded-full hover:bg-gray-200 group"
              :class="{
                'bg-primary-100 hover:bg-primary-100': isBookmarked,
                'pointer-events-none': isBookmarkedByTeam,
              }"
              @click.stop="
                onActionClick({
                  actionType: 'bookmark',
                  shouldAdd: !isBookmarked,
                })
              "
            >
              <lf-icon
                name="book-bookmark"
                :type="isBookmarked || isBookmarkedByTeam ? 'solid' : 'light'"
                class="text-gray-400 group-hover:text-gray-900"
                :class="{
                  'text-gray-400': !isBookmarked && !isBookmarkedByTeam,
                  'text-primary-600 group-hover:text-primary-600':
                    isBookmarked && !isBookmarkedByTeam,
                  'text-primary-300': isBookmarkedByTeam,
                }"
              />
            </div>
          </span>
        </el-tooltip>
      </div>
    </div>
  </div>
</template>

<script setup>
import {
  computed, defineProps, ref, watch, h,
} from 'vue';
import { useStore } from 'vuex';
import { formatDateToTimeAgo } from '@/utils/date';
import platformOptions from '@/modules/eagle-eye/constants/eagle-eye-platforms';
import { withHttp } from '@/utils/string';
import { useAuthStore } from '@/modules/auth/store/auth.store';
import { storeToRefs } from 'pinia';
import usePermissions from '@/shared/modules/permissions/helpers/usePermissions';
import { LfPermission } from '@/shared/modules/permissions/types/Permissions';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { dateHelper } from '@/shared/date-helper/date-helper';
import LfModal from '@/ui-kit/modal/Modal.vue';
import { EagleEyeService } from '../../eagle-eye-service';

const props = defineProps({
  result: {
    type: Object,
    required: true,
  },
  index: {
    type: Number,
    required: true,
  },
});

const store = useStore();
const authStore = useAuthStore();
const { user, tenant } = storeToRefs(authStore);

const { hasPermission } = usePermissions();

const eagleEyeSettings = computed(
  () => user?.value?.tenants.find((tu) => tu.tenantId === tenant?.value.id)
    ?.settings.eagleEye,
);

const generatedReply = ref('');
const replyDialogVisible = ref(false);
const replyInClipboard = ref(false);
const generatedReplyThumbsUpFeedback = ref(false);
const generatedReplyThumbsDownFeedback = ref(false);
const DialogHeading = h(
  'h5',
  {
    class: 'text-base text-lg leading-5 font-semibold pb-4 pt-2',
  },
  [
    '🤖 AI reply',
    h(
      'span',
      {
        class: 'ml-1 font-light text-xs text-purple-500',
      },
      'Alpha',
    ),
  ],
);

const isBookmarked = computed(() => props.result.actions.some((a) => a.type === 'bookmark' && !a.toRemove));
const isRelevant = computed(() => props.result.actions.some((a) => a.type === 'thumbs-up' && !a.toRemove));
const isNotRelevant = computed(() => props.result.actions.some((a) => a.type === 'thumbs-down' && !a.toRemove));
const isBookmarkedByUser = computed(() => {
  const bookmarkAction = props.result.actions.find(
    (a) => a.type === 'bookmark',
  );
  return (
    !bookmarkAction?.actionById || bookmarkAction?.actionById === user.value.id
  );
});

const isBookmarkedByTeam = computed(
  () => isBookmarked.value && !isBookmarkedByUser.value,
);

const bookmarkTooltip = computed(() => {
  if (isBookmarked.value && !isBookmarkedByUser.value) {
    return 'Bookmarked by team member';
  }

  return isBookmarked.value ? 'Unbookmark' : 'Bookmark';
});

const areGeneratedRepliesActivated = computed(
  () => eagleEyeSettings.value?.aiReplies || false,
);

const isGenerateReplyAvailable = computed(
  () => props.result.platform !== 'github'
    && props.result.platform !== 'stackoverflow'
    && props.result.platform !== 'youtube',
);

const replyTooltip = computed(() => {
  if (!isGenerateReplyAvailable.value) {
    return 'Not available for this source';
  }
  return 'Generate a reply idea';
});

// eslint-disable-next-line no-unused-vars
watch(replyInClipboard, (newValue) => {
  if (newValue) {
    setTimeout(() => {
      replyInClipboard.value = false;
    }, 5000);
  }
});

const copyToClipboard = async (reply) => {
  await navigator.clipboard.writeText(reply);
  replyInClipboard.value = true;

  await EagleEyeService.track({
    event: 'generatedReplyCopied',
    params: {
      title: props.result.post.title,
      description: props.result.post.description,
      url: props.result.url,
      platform: props.result.platform,
      reply,
    },
  });
};

const subreddit = computed(() => {
  if (props.result.platform !== 'reddit') {
    return null;
  }

  const pattern = /.*reddit\.com(?<subreddit>\/r\/.[^\\/]*).*/gm;
  const matches = pattern.exec(props.result.url);

  if (!matches?.groups.subreddit) {
    return null;
  }

  return matches.groups.subreddit.slice(1);
});

// Open post in origin url
const onCardClick = async (e) => {
  if (!props.result.url || e.target.localName === 'a') {
    return;
  }

  window.open(withHttp(props.result.url), '_blank');

  await EagleEyeService.track({
    event: 'postClicked',
    params: {
      url: props.result.url,
      platform: props.result.platform,
    },
  });
};

const onCardClickFromDialog = async (e) => {
  replyDialogVisible.value = false;
  setTimeout(() => {
    onCardClick(e);
  }, 200);
};

const generatedReplyFeedback = async (reply, type) => {
  if (type === 'thumbs-up') {
    if (generatedReplyThumbsUpFeedback.value) {
      return;
    }
    generatedReplyThumbsUpFeedback.value = true;
    generatedReplyThumbsDownFeedback.value = false;
  } else {
    if (generatedReplyThumbsDownFeedback.value) {
      return;
    }
    generatedReplyThumbsDownFeedback.value = true;
    generatedReplyThumbsUpFeedback.value = false;
  }
  await EagleEyeService.track({
    event: 'generatedReplyFeedback',
    params: {
      type,
      title: props.result.post.title,
      description: props.result.post.description,
      url: props.result.url,
      platform: props.result.platform,
      reply,
    },
  });
};

const onGenerateReplyClick = async () => {
  if (!isGenerateReplyAvailable.value) {
    return;
  }
  replyDialogVisible.value = true;
  if (generatedReply.value !== '') {
    return;
  }

  const savedReplies = JSON.parse(localStorage.getItem('eagleEyeReplies')) || {};

  if (savedReplies && savedReplies[props.result.url]) {
    generatedReply.value = savedReplies[props.result.url];
    return;
  }

  const generated = await EagleEyeService.generateReply({
    title: props.result.post.title,
    description: props.result.post.description,
  });
  generatedReply.value = generated.reply;
  savedReplies[props.result.url] = generated.reply;
  localStorage.setItem('eagleEyeReplies', JSON.stringify(savedReplies));

  await EagleEyeService.track({
    event: 'generatedReply',
    params: {
      title: props.result.post.title,
      description: props.result.post.description,
      url: props.result.url,
      platform: props.result.platform,
      reply: generatedReply.value,
    },
  });
};

const onActionClick = async ({ actionType, shouldAdd }) => {
  const storeActionType = shouldAdd ? 'add' : 'delete';
  const action = shouldAdd
    ? {
      type: actionType,
      timestamp: dateHelper(),
    }
    : props.result.actions.find((a) => a.type === actionType);

  store.dispatch('eagleEye/doAddTemporaryPostAction', {
    index: props.index,
    storeActionType,
    action,
  });

  store.dispatch('eagleEye/doAddActionQueue', {
    index: props.index,
    id: props.result.id,
    post: props.result,
    handler: () => store.dispatch('eagleEye/doUpdatePostAction', {
      post: props.result,
      index: props.index,
      storeActionType,
      actionType,
    }),
  });
};
</script>

<style lang="scss" scoped>
.eagle-eye-result-content a {
  @apply text-gray-500 underline;
}

.copy-icon {
  @apply h-8 w-8 flex items-center justify-center rounded-full bg-transparent text-gray-400 hover:bg-gray-200 hover:text-gray-900 cursor-pointer;
}

.slide-enter-active,
.slide-leave-active {
  transition: all 0.2s ease-out;
}

.slide-enter-from {
  opacity: 0;
  transform: translateX(-15px);
}

.slide-leave-to {
  opacity: 0;
  transform: translateX(15px);
}

.fade-out-in-enter-active,
.fade-out-in-leave-active {
  transition: all 0.3s ease-in-out;
}

.fade-out-in-enter-from {
  opacity: 0;
}

.fade-out-in-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: all 0.6s ease-in-out;
}

.fade-enter-from {
  opacity: 0;
}

.fade-leave-to {
  opacity: 0;
}
</style>
