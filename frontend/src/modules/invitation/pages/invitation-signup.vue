<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <div class="text-center">
        <img class="mx-auto h-12 w-auto" src="/icons/logo.svg" alt="crowd.dev" />
        <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Join workspace
        </h2>
        <p class="mt-2 text-center text-sm text-gray-600">
          You've been invited to join a workspace on crowd.dev
        </p>
      </div>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <!-- Loading State -->
        <div v-if="validating" class="text-center py-8">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500 mx-auto"></div>
          <p class="mt-2 text-sm text-gray-600">Validating invitation...</p>
        </div>

        <!-- Invalid Token -->
        <div v-else-if="validationError" class="text-center py-8">
          <lf-icon name="x-circle" class="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 class="text-lg font-medium text-gray-900 mb-2">Invalid Invitation</h3>
          <p class="text-sm text-gray-600 mb-4">{{ validationError }}</p>
          <lf-button type="primary" @click="$router.push('/auth/signin')">
            Go to Sign In
          </lf-button>
        </div>

        <!-- Valid Token - Signup Form -->
        <div v-else-if="validInvitation">
          <div class="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div class="flex">
              <lf-icon name="check-circle" class="h-5 w-5 text-green-500 mr-2 mt-0.5" />
              <div class="text-sm">
                <p class="text-green-800 font-medium">Valid invitation</p>
                <p class="text-green-600 mt-1">
                  You're invited to join with <strong>{{ roleDisplay(validInvitation.defaultRole) }}</strong> access.
                  Only emails ending with <code>@{{ validInvitation.emailDomain }}</code> are allowed.
                </p>
              </div>
            </div>
          </div>

          <form @submit.prevent="handleSignup" class="space-y-6">
            <!-- Full Name -->
            <div>
              <label for="fullName" class="block text-sm font-medium text-gray-700">
                Full name
              </label>
              <div class="mt-1">
                <input
                  id="fullName"
                  v-model="signupForm.fullName"
                  name="fullName"
                  type="text"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Enter your full name"
                />
              </div>
            </div>

            <!-- Email -->
            <div>
              <label for="email" class="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <div class="mt-1">
                <input
                  id="email"
                  v-model="signupForm.email"
                  name="email"
                  type="email"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  :placeholder="`Enter email ending with @${validInvitation.emailDomain}`"
                />
              </div>
              <div v-if="emailError" class="mt-1 text-sm text-red-600">
                {{ emailError }}
              </div>
            </div>

            <!-- Password -->
            <div>
              <label for="password" class="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div class="mt-1">
                <input
                  id="password"
                  v-model="signupForm.password"
                  name="password"
                  type="password"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Create a password"
                />
              </div>
            </div>

            <!-- Confirm Password -->
            <div>
              <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                Confirm password
              </label>
              <div class="mt-1">
                <input
                  id="confirmPassword"
                  v-model="signupForm.confirmPassword"
                  name="confirmPassword"
                  type="password"
                  required
                  class="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  placeholder="Confirm your password"
                />
              </div>
              <div v-if="passwordError" class="mt-1 text-sm text-red-600">
                {{ passwordError }}
              </div>
            </div>

            <!-- Terms and Privacy -->
            <div>
              <div class="flex items-center">
                <input
                  id="acceptTerms"
                  v-model="signupForm.acceptedTermsAndPrivacy"
                  name="acceptTerms"
                  type="checkbox"
                  required
                  class="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label for="acceptTerms" class="ml-2 block text-sm text-gray-900">
                  I accept the 
                  <a href="#" class="text-primary-600 hover:text-primary-500">Terms of Service</a>
                  and 
                  <a href="#" class="text-primary-600 hover:text-primary-500">Privacy Policy</a>
                </label>
              </div>
            </div>

            <!-- Submit Button -->
            <div>
              <lf-button
                type="primary"
                size="large"
                class="w-full"
                :loading="signingUp"
                :disabled="!isFormValid"
              >
                Create account and join workspace
              </lf-button>
            </div>

            <!-- Error Message -->
            <div v-if="signupError" class="rounded-md bg-red-50 p-4">
              <div class="flex">
                <lf-icon name="x-circle" class="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <div class="text-sm text-red-700">
                  {{ signupError }}
                </div>
              </div>
            </div>
          </form>

          <!-- Sign In Link -->
          <div class="mt-6 text-center">
            <p class="text-sm text-gray-600">
              Already have an account?
              <router-link to="/auth/signin" class="font-medium text-primary-600 hover:text-primary-500">
                Sign in
              </router-link>
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import LfButton from '@/ui-kit/button/Button.vue';
import LfIcon from '@/ui-kit/icon/Icon.vue';
import { InvitationLinkService } from '@/modules/invitation/services/invitation-link.service';
import { useAuthStore } from '@/modules/auth/store/auth.store';

interface InvitationValidation {
  valid: boolean;
  emailDomain: string;
  defaultRole: string;
}

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

const validating = ref(true);
const validationError = ref<string | null>(null);
const validInvitation = ref<InvitationValidation | null>(null);
const signingUp = ref(false);
const signupError = ref<string | null>(null);

const signupForm = ref({
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptedTermsAndPrivacy: false,
});

const emailError = computed(() => {
  if (!signupForm.value.email || !validInvitation.value) return null;
  
  const emailDomain = signupForm.value.email.split('@')[1];
  if (emailDomain !== validInvitation.value.emailDomain) {
    return `Email must end with @${validInvitation.value.emailDomain}`;
  }
  return null;
});

const passwordError = computed(() => {
  if (!signupForm.value.password || !signupForm.value.confirmPassword) return null;
  
  if (signupForm.value.password !== signupForm.value.confirmPassword) {
    return 'Passwords do not match';
  }
  return null;
});

const isFormValid = computed(() => {
  return (
    signupForm.value.fullName &&
    signupForm.value.email &&
    signupForm.value.password &&
    signupForm.value.confirmPassword &&
    signupForm.value.acceptedTermsAndPrivacy &&
    !emailError.value &&
    !passwordError.value
  );
});

const validateInvitation = async () => {
  const token = route.query.token as string;
  if (!token) {
    validationError.value = 'No invitation token provided.';
    validating.value = false;
    return;
  }

  try {
    const validation = await InvitationLinkService.validateInvitationLink(token);
    if (validation.valid) {
      validInvitation.value = validation;
    } else {
      validationError.value = 'This invitation link has expired or is no longer valid.';
    }
  } catch (error: any) {
    console.error('Invitation validation error:', error);
    validationError.value = error.message || 'Failed to validate invitation. Please try again.';
  } finally {
    validating.value = false;
  }
};

const handleSignup = async () => {
  if (!isFormValid.value || !validInvitation.value) return;

  signingUp.value = true;
  signupError.value = null;

  try {
    const token = route.query.token as string;
    const response = await InvitationLinkService.signupViaInvitationLink({
      invitationToken: token,
      email: signupForm.value.email,
      password: signupForm.value.password,
      fullName: signupForm.value.fullName,
      acceptedTermsAndPrivacy: signupForm.value.acceptedTermsAndPrivacy,
    });

    // Store the JWT token and user data
    authStore.setToken(response.token);
    authStore.setCurrentUser(response.user);

    // Redirect to dashboard
    await router.push('/dashboard');
  } catch (error: any) {
    console.error('Signup error:', error);
    signupError.value = error.message || 'Failed to create account. Please try again.';
  } finally {
    signingUp.value = false;
  }
};

const roleDisplay = (role: string) => {
  if (role === 'readonly') return 'Viewer';
  if (role === 'admin') return 'Admin';
  return role;
};

onMounted(() => {
  validateInvitation();
});

// Clear errors when form changes
watch(() => signupForm.value.email, () => {
  signupError.value = null;
});

watch(() => signupForm.value.password, () => {
  signupError.value = null;
});
</script>

<script lang="ts">
export default {
  name: 'InvitationSignup',
};
</script>