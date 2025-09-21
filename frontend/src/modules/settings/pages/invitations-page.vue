<template>
  <div class="invitations-page">
    <div class="mb-8">
      <h5 class="text-lg font-semibold text-gray-900 mb-2">
        Workspace invitations
      </h5>
      <p class="text-sm text-gray-600">
        Manage invitation links that allow new members to join your workspace.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-8">
      <!-- Self-signup Invitation Links -->
      <div class="bg-white border border-gray-200 rounded-lg p-6">
        <invitation-link-widget />
      </div>

      <!-- Information Section -->
      <div class="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <lf-icon name="info-circle" class="h-5 w-5 text-blue-500" />
          </div>
          <div class="ml-3">
            <h6 class="text-sm font-medium text-blue-900 mb-2">
              About invitation links
            </h6>
            <div class="text-sm text-blue-700 space-y-2">
              <p>
                Self-signup invitation links allow anyone with a matching email domain 
                to join your workspace without requiring individual invitations.
              </p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>Links are restricted to your organization's email domain</li>
                <li>New users automatically receive "Viewer" role permissions</li>
                <li>Links expire after a set period for security</li>
                <li>You can regenerate or disable links at any time</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Security Notice -->
      <div class="bg-amber-50 border border-amber-200 rounded-lg p-6">
        <div class="flex">
          <div class="flex-shrink-0">
            <lf-icon name="shield-exclamation" class="h-5 w-5 text-amber-500" />
          </div>
          <div class="ml-3">
            <h6 class="text-sm font-medium text-amber-900 mb-2">
              Security considerations
            </h6>
            <div class="text-sm text-amber-700 space-y-2">
              <p>
                Only share invitation links with trusted colleagues. Anyone with 
                access to the link and a matching email domain can join your workspace.
              </p>
              <p class="font-medium">
                Best practices:
              </p>
              <ul class="list-disc list-inside space-y-1 ml-2">
                <li>Share links through secure channels only</li>
                <li>Regularly review workspace members</li>
                <li>Regenerate links if you suspect compromise</li>
                <li>Consider using individual invites for sensitive workspaces</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import LfIcon from '@/ui-kit/icon/Icon.vue';
import InvitationLinkWidget from '@/modules/invitation/components/invitation-link-widget.vue';
</script>

<script lang="ts">
export default {
  name: 'AppInvitationsPage',
};
</script>

<style scoped>
.invitations-page {
  /* Component-specific styles */
}
</style>