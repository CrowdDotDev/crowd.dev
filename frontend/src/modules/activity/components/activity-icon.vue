<template>
  <div
    v-if="icons[platform]?.[type]"
    class="absolute z-10 -top-1.5 -right-1.5 outline outline-2 outline-offset-0 outline-white rounded-full h-5 w-5 flex items-center justify-center"
    :class="icons[platform][type].bgColor"
  >
    <i
      v-if="icons[platform][type].iconClass"
      :class="`${icons[platform][type].iconClass} ${icons[platform][type].color} text-2xs leading-3`"
    />
    <img
      v-else
      :src="icons[platform][type].imgSrc"
      :alt="type"
      class="min-w-5 h-5"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';

defineProps({
  type: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    required: true,
  },
});

const icons = ref({
  github: {
    'issue-comment': {
      iconClass: 'fa-message fa-light',
      color: 'text-black',
      bgColor: 'bg-gray-200',
    },
    'pull_request-opened': {
      iconClass: 'fa-code-pull-request fa-light',
      color: 'text-white',
      bgColor: 'bg-green-600',
    },
    'pull_request-closed': {
      iconClass: 'fa-code-pull-request-closed fa-light',
      color: 'text-white',
      bgColor: 'bg-red-600',
    },
    'pull_request-comment': {
      iconClass: 'fa-message fa-light',
      color: 'text-black',
      bgColor: 'bg-gray-200',
    },
    'discussion-comment': {
      iconClass: 'fa-message fa-light',
      color: 'text-black',
      bgColor: 'bg-gray-200',
    },
    'pull_request-review-requested': {
      iconClass: 'fa-eye fa-light',
      color: 'text-black',
      bgColor: 'bg-gray-200',
    },
    'pull_request-reviewed': {
      iconClass: 'fa-eye fa-light',
      color: 'text-black',
      bgColor: 'bg-gray-200',
    },
    'pull_request-assigned': {
      iconClass: 'fa-paper-plane-top fa-light',
      color: 'text-black',
      bgColor: 'bg-gray-200',
    },
    'pull_request-merged': {
      iconClass: 'fa-code-merge fa-light',
      color: 'text-white',
      bgColor: 'bg-purple-600',
    },
    'pull_request-review-thread-comment': {
      iconClass: 'fa-message fa-light',
      color: 'text-black',
      bgColor: 'bg-gray-200',
    },
  },
  git: {
    commit: {
      imgSrc: new URL('@/assets/images/integrations/git.png', import.meta.url)
        .href,
      color: 'text-black',
      bgColor: 'bg-white',
    },
  },
  confluence: {
    page: {
      imgSrc: new URL('@/assets/images/integrations/conf.jpg', import.meta.url)
        .href,
      color: 'text-black',
      bgColor: 'bg-white',
    },
  },
  gerrit: {
    page: {
      imgSrc: new URL(
        '@/assets/images/integrations/gerrit.jpg',
        import.meta.url,
      ).href,
      color: 'text-black',
      bgColor: 'bg-white',
    },
  },
});
</script>

<script>
export default {
  name: 'AppActivityIcon',
};
</script>
