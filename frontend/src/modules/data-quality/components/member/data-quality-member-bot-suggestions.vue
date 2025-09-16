<template>
  <div>
    <div v-if="loading && offset === 0" class="flex justify-center py-20">
      <lf-spinner />
    </div>
    <lf-scroll-body-controll v-else-if="botSuggestions.length > 0" @bottom="loadMore()">
      <lf-data-quality-member-bot-suggestion-item
        v-for="(suggestion) of botSuggestions"
        :key="suggestion.id"
        :suggestion="suggestion"
      >
        <template #action>
          <div class="flex gap-3">
            <lf-button type="secondary" size="small" @click="markAsBot(suggestion, true)" :disabled="itemsLoading[suggestion.memberId]">
              <!-- <lf-icon name="eye" /> -->
              <img alt="LFX logo" :src="botImage" v-if="!itemsLoading[suggestion.memberId]" />
              <lf-spinner v-else size="16px" />
              Mark as bot
            </lf-button>
            <lf-member-bot-suggestion-dropdown :suggestion="suggestion" @reload="reload()" @ignoreSuggestion="markAsBot(suggestion, false)" />
          </div>
        </template>
      </lf-data-quality-member-bot-suggestion-item>
      <div v-if="botSuggestions.length < total" class="pt-4">
        <lf-button
          type="primary-ghost"
          loading-text="Loading suggestions..."
          :loading="loading"
          @click="loadMore()"
        >
          Load more
        </lf-button>
      </div>
    </lf-scroll-body-controll>
    <div v-else class="flex flex-col items-center pt-16">
      <lf-icon name="shuffle" :size="160" class="text-gray-200 flex items-center mb-8" />
      <h5 class="text-center text-lg font-semibold mb-4">
        No bot suggestions
      </h5>
      <p class="text-sm text-center text-gray-600 leading-5">
        We couldn't find any bot suggestions
      </p>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { MemberService } from '@/modules/member/member-service';
import {
  onMounted, ref, watch,
} from 'vue';
import LfDataQualityMemberBotSuggestionItem
  from '@/modules/data-quality/components/member/data-quality-member-bot-suggestion-item.vue';
import LfSpinner from '@/ui-kit/spinner/Spinner.vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { ToastStore } from '@/shared/message/notification';
import LfMemberBotSuggestionDropdown
  from '@/modules/member/components/suggestions/member-bot-suggestion-dropdown.vue';
import LfScrollBodyControll from '@/ui-kit/scrollcontroll/ScrollBodyControll.vue';

const props = defineProps<{
  projectGroup: string,
}>();

const botImage = new URL('@/assets/images/suggestions/bot.svg', import.meta.url).href;

const loading = ref(true);
const limit = ref(20);
const offset = ref(0);
const total = ref(0);
const botSuggestions = ref<any[]>([]);
const itemsLoading = ref<any>({});

const detailsOffset = ref<number>(0);


const loadBotSuggestions = () => {
  loading.value = true;

  MemberService.fetchBotSuggestions(limit.value, offset.value)
    .then((res) => {
      total.value = +res.count;
      const rows = res.rows.filter((s: any) => s.confidence > 0);
      if (+res.offset > 0) {
        botSuggestions.value = [...botSuggestions.value, ...rows];
      } else {
        botSuggestions.value = rows;
      }
    })
    .finally(() => {
      loading.value = false;
    });
};

const markAsBot = (suggestion: any, bot = true) => {
  itemsLoading.value[suggestion.memberId] = true;

  setTimeout(() => {
    itemsLoading.value[suggestion.memberId] = false;
  }, 1000);
  // MemberService.update(suggestion.memberId, {
  //   "isBot": {
  //     "custom": bot,
  //     "default": bot
  //   }
  // }).then(() => {
  //   reload();
  // }).catch((err) => {
  //   ToastStore.error(err.response.data);
  // }).finally(() => {
  //   itemsLoading.value[suggestion.id] = false;
  // });
};

const loadMore = () => {
  offset.value = botSuggestions.value.length;
  loadBotSuggestions();
};

const reload = () => {
  offset.value = 0;
  loadBotSuggestions();
};

watch(() => props.projectGroup, () => {
  offset.value = 0;
  loadBotSuggestions();
});

onMounted(() => {
  loadBotSuggestions();
});
</script>

<script lang="ts">
export default {
  name: 'LfDataQualityMemberBotSuggestions',
};
</script>
