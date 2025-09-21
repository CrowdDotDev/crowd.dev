<template>
  <div class="invitation-link-component">
    <div class="flex items-center justify-between mb-4">
      <h4 class="text-sm font-medium text-gray-900">
        Self-signup invitation link
      </h4>
      <lf-button
        v-if="!invitationLink"
        type="primary-ghost"
        size="small"
        :loading="generating"
        @click="generateLink"
      >
        Generate link
      </lf-button>
    </div>
    
    <div v-if="invitationLink" class="space-y-4">
      <!-- Link Display -->
      <div class="bg-gray-50 rounded-lg p-4">
        <div class="flex items-center justify-between mb-2">
          <span class="text-xs font-medium text-gray-700">Invitation URL</span>
          <lf-button
            type="primary-ghost"
            size="small"
            @click="copyToClipboard"
          >
            <lf-icon name="copy" :size="16" class="mr-2" />
            Copy
          </lf-button>
        </div>
        <div class="bg-white border rounded p-2">
          <code class="text-xs text-gray-800 break-all">{{ invitationLink.invitationUrl }}</code>
        </div>
      </div>

      <!-- Link Details -->
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span class="text-gray-600">Email domain:</span>
          <span class="ml-1 font-medium">{{ invitationLink.emailDomain }}</span>
        </div>
        <div>
          <span class="text-gray-600">Default role:</span>
          <span class="ml-1 font-medium capitalize">{{ roleDisplay(invitationLink.defaultRole) }}</span>
        </div>
      </div>

      <!-- Expiry Info -->
      <div class="text-xs text-gray-500">
        <lf-icon name="clock" :size="14" class="mr-1" />
        Expires on {{ formatDate(invitationLink.expiresAt) }}
      </div>

      <!-- Security Notice -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div class="flex">
          <lf-icon name="info-circle" :size="16" class="text-blue-500 mr-2 mt-0.5" />
          <div class="text-xs text-blue-700">
            <strong>Security:</strong> Only users with email addresses matching 
            <code class="bg-blue-100 px-1 rounded">@{{ invitationLink.emailDomain }}</code> 
            can sign up using this link.
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex space-x-2">
        <lf-button
          type="secondary"
          size="small"
          @click="regenerateLink"
          :loading="generating"
        >
          Regenerate link
        </lf-button>
        <lf-button
          type="secondary-ghost"
          size="small"
          @click="clearLink"
        >
          Clear
        </lf-button>
      </div>
    </div>

    <!-- No Link State -->
    <div v-else class="text-center py-6">
      <lf-icon name="link" class="mx-auto h-8 w-8 text-gray-400 mb-2" />
      <p class="text-sm text-gray-500 mb-1">
        No invitation link generated
      </p>
      <p class="text-xs text-gray-400">
        Create a link that allows colleagues to join your workspace
      </p>
    </div>

    <!-- Success Toast -->
    <div
      v-if="showCopiedNotification"
      class="fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
    >
      <div class="flex items-center">
        <lf-icon name="check" :size="16" class="mr-2" />
        Invitation link copied to clipboard
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { InvitationLinkService } from '@/modules/invitation/services/invitation-link.service';

interface InvitationLink {
  invitationUrl: string;
  emailDomain: string;
  defaultRole: string;
  expiresAt: string;
}

const invitationLink = ref<InvitationLink | null>(null);
const generating = ref(false);
const showCopiedNotification = ref(false);

const generateLink = async () => {
  generating.value = true;
  try {
    invitationLink.value = await InvitationLinkService.generateInvitationLink('readonly');
  } catch (error) {
    console.error('Failed to generate invitation link:', error);
    // You might want to show an error notification here
  } finally {
    generating.value = false;
  }
};

const regenerateLink = async () => {
  generating.value = true;
  try {
    invitationLink.value = await InvitationLinkService.generateInvitationLink(invitationLink.value?.defaultRole || 'readonly');
  } catch (error) {
    console.error('Failed to regenerate invitation link:', error);
  } finally {
    generating.value = false;
  }
};

const clearLink = () => {
  invitationLink.value = null;
};

const copyToClipboard = async () => {
  if (invitationLink.value?.invitationUrl) {
    try {
      await navigator.clipboard.writeText(invitationLink.value.invitationUrl);
      showCopiedNotification.value = true;
      setTimeout(() => {
        showCopiedNotification.value = false;
      }, 3000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = invitationLink.value.invitationUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showCopiedNotification.value = true;
      setTimeout(() => {
        showCopiedNotification.value = false;
      }, 3000);
    }
  }
};

const roleDisplay = (role: string) => {
  if (role === 'readonly') return 'Viewer';
  if (role === 'admin') return 'Admin';
  return role;
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
</script>

<script lang="ts">
export default {
  name: 'InvitationLinkWidget',
};
</script>

<style scoped>
.invitation-link-component {
  /* Component styles */
}
</style>