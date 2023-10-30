<template>
  <app-page-wrapper size="narrow">
    <div class="profile-form-page">
      <h4 class="mb-6">
        Account settings
      </h4>
      <el-container
        class="bg-white rounded-lg shadow shadow-black/15 mb-6"
      >
        <el-main class="p-6">
          <el-form
            ref="profileFormRef"
            label-position="top"
            :model="profileModel"
            :rules="profileRules"
            class="form"
            @submit.prevent="doSubmit"
          >
            <div class="grid gap-x-12 grid-cols-3">
              <h6>Personal details</h6>
              <div class="col-span-2">
                <el-form-item
                  :label="computedFields.email.label"
                  :prop="computedFields.email.name"
                  :required="computedFields.email.required"
                >
                  <el-input
                    ref="focus"
                    v-model="
                      profileModel[
                        computedFields.email.name
                      ]
                    "
                    disabled
                  />
                </el-form-item>
                <div class="flex gap-6">
                  <el-form-item
                    class="grow"
                    :label="computedFields.firstName.label"
                    :prop="computedFields.firstName.name"
                    :required="
                      computedFields.firstName.required
                    "
                  >
                    <el-input
                      ref="focus"
                      v-model="
                        profileModel[
                          computedFields.firstName.name
                        ]
                      "
                    />
                  </el-form-item>

                  <el-form-item
                    class="grow"
                    :label="computedFields.lastName.label"
                    :prop="computedFields.lastName.name"
                    :required="
                      computedFields.lastName.required
                    "
                  >
                    <el-input
                      v-model="
                        profileModel[
                          computedFields.lastName.name
                        ]
                      "
                    />
                  </el-form-item>
                </div>
              </div>
            </div>
          </el-form>
        </el-main>
        <el-footer
          class="bg-gray-50 flex items-center p-6 h-fit rounded-b-lg"
          :class="
            hasFormChanged
              ? 'justify-between'
              : 'justify-end'
          "
        >
          <el-button
            v-if="hasFormChanged"
            class="btn btn-link btn-link--primary"
            :disabled="saveLoading"
            @click="doReset"
          >
            <i class="ri-arrow-go-back-line" />
            <span>Reset changes</span>
          </el-button>
          <div class="flex gap-4">
            <el-button
              :disabled="saveLoading"
              class="btn btn--md btn--secondary"
              @click="doCancel"
            >
              Cancel
            </el-button>
            <el-button
              class="btn btn--md btn--primary"
              :disabled="
                saveLoading
                  || !hasFormChanged
                  || !isFormValid
              "
              @click="doSubmit"
            >
              <app-i18n code="common.save" />
            </el-button>
          </div>
        </el-footer>
      </el-container>
      <el-container
        class="bg-white rounded-lg shadow shadow-black/15"
      >
        <el-main class="p-6">
          <el-form
            ref="passwordFormRef"
            label-position="top"
            class="form"
            @submit.prevent="doSubmit"
          >
            <div class="grid gap-x-12 grid-cols-3">
              <h6>Change password</h6>
              <div class="col-span-2">
                <app-form-item label="E-mail" :validation="$v.email">
                  <el-input
                    ref="focus"
                    v-model="passwordResetForm.email"
                    type="email"
                    disabled
                  />
                </app-form-item>
              </div>
            </div>
          </el-form>
        </el-main>
        <el-footer
          class="bg-gray-50 flex items-center justify-end p-6 h-fit rounded-b-lg"
        >
          <el-button
            class="btn btn--md btn--primary"
            :disabled="$v.$invalid"
            @click="changePassword"
          >
            Change password
          </el-button>
        </el-footer>
      </el-container>
    </div>
  </app-page-wrapper>
</template>

<script setup>
import { useStore } from 'vuex';
import {
  ref, computed, onBeforeMount, reactive,
} from 'vue';
import isEqual from 'lodash/isEqual';
import { useRouter } from 'vue-router';
import { FormSchema } from '@/shared/form/form-schema';
import { UserModel } from '@/modules/user/user-model';
import useVuelidate from '@vuelidate/core';
import { email, required } from '@vuelidate/validators';
import AppFormItem from '@/shared/form/form-item.vue';
import AppI18n from '@/shared/i18n/i18n.vue';
import { Auth0Service } from '@/shared/services/auth0.service';
import Message from '@/shared/message/message';

const { fields } = UserModel;
const store = useStore();
const router = useRouter();

const profileFormSchema = computed(
  () => new FormSchema([
    fields.email,
    fields.firstName,
    fields.lastName,
  ]),
);
const passwordFormSchema = computed(
  () => new FormSchema([
    fields.oldPassword,
    fields.newPassword,
    fields.newPasswordConfirmation,
  ]),
);

const currentUser = computed(
  () => store.getters['auth/currentUser'],
);
const saveLoading = computed(
  () => store.getters['auth/loadingUpdateProfile']
    || store.getters['auth/loadingPasswordChange'],
);

const computedFields = computed(() => fields);

const passwordResetForm = reactive({
  email: currentUser.value.email,
});

const rules = {
  email: {
    required,
    email,
  },
};

const $v = useVuelidate(rules, passwordResetForm);
// Form references
const profileFormRef = ref(null);
const passwordFormRef = ref(null);

// Form models
const profileModel = ref(null);
const passwordModel = ref(null);

// Form rules
const profileRules = ref(profileFormSchema.value.rules());

// Form validations
const hasProfileModelChanged = computed(() => !isEqual(
  profileFormSchema.value.initialValues(
    currentUser.value,
  ),
  profileModel.value,
));
const hasPasswordModelChanged = computed(
  () => !isEqual(
    passwordFormSchema.value.initialValues(
      currentUser.value,
    ),
    passwordModel.value,
  ),
);
const hasFormChanged = computed(
  () => hasProfileModelChanged.value
    || hasPasswordModelChanged.value,
);

const isProfileFormValid = computed(() => profileFormSchema.value.isValidSync(profileModel.value));
const isPasswordFormValid = computed(() => passwordFormSchema.value.isValidSync(passwordModel.value));

const isFormValid = computed(
  () => ((hasPasswordModelChanged.value
      && isPasswordFormValid.value)
      || !hasPasswordModelChanged.value)
    && ((hasProfileModelChanged.value
      && isProfileFormValid.value)
      || !hasProfileModelChanged.value),
);

onBeforeMount(() => {
  profileModel.value = profileFormSchema.value.initialValues(currentUser.value);
  passwordModel.value = passwordFormSchema.value.initialValues(
    currentUser.value,
  );
});

const doCancel = () => {
  router.push({ path: '/' });
};

const doReset = () => {
  profileModel.value = profileFormSchema.value.initialValues(currentUser.value);

  passwordModel.value = passwordFormSchema.value.initialValues(
    currentUser.value,
  );
};

const changePassword = () => {
  if ($v.value.$invalid) {
    return;
  }
  Auth0Service.changePassword(passwordResetForm.email)
    .then(() => {
      Message.success('Password change link has been send to your email address');
    })
    .catch(() => {
      Message.error('There was an error changing password');
    });
};

const doSubmit = async () => {
  // Submit for profile changes
  if (hasProfileModelChanged.value) {
    try {
      await profileFormRef.value.validate();
    } catch (error) {
      return;
    }

    const values = profileFormSchema.value.cast(
      profileModel.value,
    );

    store.dispatch('auth/doUpdateProfile', values);
    router.push('/');
  }

  // Submit for password changes
  if (hasPasswordModelChanged.value) {
    try {
      await passwordFormRef.value.validate();
    } catch (error) {
      return;
    }

    const values = passwordFormSchema.value.cast(
      passwordModel.value,
    );

    store.dispatch('auth/doChangePassword', values);
  }
};
</script>

<script>
export default {
  name: 'AppProfileFormPage',
};
</script>

<style lang="scss">
.profile-form-page {
  .el-form .el-form-item__content,
  .el-form--default.el-form--label-top
    .el-form-item__content {
    @apply mb-6;
  }
}
</style>
