<template>
  <div class="settings-links">
    <hr class="pb-6" />
    <div class="font-semibold text-sm text-brand-500 mb-6">
      Community links
    </div>
    <el-form-item
      label="Website"
      prop="website"
      :required="true"
      class="w-full"
    >
      <el-input
        v-model="computedWebsite"
        placeholder="https://crowd.dev"
      />
      <div class="app-form-hint">
        URL of your community/company
      </div>
    </el-form-item>
    <el-form-item
      v-if="activeIntegrations.includes('discord')"
      label="Discord URL"
      prop="discordInviteLink"
      class="w-full"
    >
      <el-input
        v-model="computedDiscordInviteLink"
        placeholder="https://invite.discord.url"
      />
      <div class="app-form-hint flex items-center">
        Permanent Discord invite link
      </div>
    </el-form-item>
    <el-form-item
      v-if="activeIntegrations.includes('slack')"
      label="Slack URL"
      prop="slackInviteLink"
      class="w-full"
    >
      <el-input
        v-model="computedSlackInviteLink"
        placeholder="https://invite.slack.url"
      />
      <div class="app-form-hint">
        Permanent Slack invite link
      </div>
    </el-form-item>
    <el-form-item
      v-if="activeIntegrations.includes('github')"
      label="GitHub URL"
      prop="githubInviteLink"
      class="w-full"
    >
      <el-input
        v-model="computedGithubInviteLink"
        placeholder="https://github.com/CrowdHQ"
      />
      <div class="app-form-hint">
        GitHub's organization URL
      </div>
    </el-form-item>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';
import { useStore } from 'vuex';

const store = useStore();

const props = defineProps({
  website: {
    type: String,
    default: null,
  },
  slackInviteLink: {
    type: String,
    default: null,
  },
  discordInviteLink: {
    type: String,
    default: null,
  },
  githubInviteLink: {
    type: String,
    default: null,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits([
  'update:website',
  'update:slackInviteLink',
  'update:discordInviteLink',
  'update:githubInviteLink',
]);

const computedWebsite = computed({
  get() {
    return props.website;
  },
  set(value) {
    emit('update:website', value);
  },
});

const computedDiscordInviteLink = computed({
  get() {
    return props.discordInviteLink;
  },
  set(value) {
    emit('update:discordInviteLink', value);
  },
});

const computedSlackInviteLink = computed({
  get() {
    return props.slackInviteLink;
  },
  set(value) {
    emit('update:slackInviteLink', value);
  },
});

const computedGithubInviteLink = computed({
  get() {
    return props.githubInviteLink;
  },
  set(value) {
    emit('update:githubInviteLink', value);
  },
});

const activeIntegrations = computed(() => Object.keys(store.getters['integration/activeList']));
</script>
