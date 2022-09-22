/**
 * I18n dictionary for the en.
 */

const en = {
  app: {
    title: 'crowd.dev',
  },

  settings: {
    memberAttributes: {
      errors: {
        wrongType: `Member attribute {0} should have type {1}.`,
        alreadyExists: `Attribute with name '{0}' already exists.`,
        typesNotMatching: `Attribute types cannot be changed after creation.`,
        canDeleteReadonly: `Readonly field canDelete cannot be updated.`,
        requiredFields: `Type and label fields are required when creating member attributes.`,
        notFound: `Member attribute {0} not found in memberAttributeSettings.`,
        noPlatformSent: `Cannot select the highest priority platform. No platform was sent.`,
        priorityArrayNotFound: `Member attributes platform priority array does not exist.`,
      },
    },
  },

  auth: {
    userNotFound: `Sorry, this email does not match any record in our database`,
    wrongPassword: `Wrong password`,
    weakPassword: 'This password is too weak',
    emailAlreadyInUse: 'This email is already taken',
    invalidEmail: 'Invalid email',
    passwordReset: {
      invalidToken: 'Invalid or expired password reset link',
      error: `Invalid email`,
    },
    emailAddressVerificationEmail: {
      invalidToken: 'Invalid or expired email verification link.',
      error: `Email not recognized.`,
      signedInAsWrongUser: `This email confirmation was sent to {0} but you're signed in as {1}.`,
    },
    passwordChange: {
      invalidPassword: 'Wrong old password',
    },
  },

  cubejs: {
    invalidToken: `JWT token can't be verified`,
    tenantIdNotMatching: `Tenant id in url params and given jwt token don't match`,
  },

  user: {
    errors: {
      userAlreadyExists: 'This email is already in use.',
      userNotFound: 'User does not exist.',
      destroyingHimself: `You can't delete your own user.`,
      revokingOwnPermission: `You can't revoke your own admin permissions.`,
      revokingPlanUser: `You can't revoke the admin permission of the workspace manager.`,
      destroyingPlanUser: `You can't delete the workspace manager.`,
    },
  },

  tenant: {
    exists: 'There is already a workspace on this application.',
    url: {
      exists: 'This workspace URL is already being used',
    },
    invitation: {
      notSameEmail: `This invitation was sent to {0} but you're signed in as {1}.`,
    },
    planActive: `There is a plan active for this workspace. Please cancel the plan first.`,
    stripeNotConfigured: 'Please configure stripe first',
    sampleDataCreationStarted: 'Sample data generation started.',
    sampleDataDeletionCompleted: 'Sample data deletion completed.',
    errors: {
      publishedConversationExists: 'Update failed. Tenant already has published conversations.',
    },
  },

  errors: {
    notFound: {
      message: 'Page not found',
    },
    forbidden: {
      message: 'You have no authorization to access this page.',
    },
    missingScopes: {
      message:
        'Missing scopes in {integration}: {scopes}. This is probably due to an outdated version of the integration. Please reinstall and try again.',
    },
    validation: {
      message: 'An unexpected error occurred',
    },
    noMember: {
      message: 'Member does not exist',
    },
    activityDup: {
      message: 'This activity has already been linked to this member',
    },
    invalidEagleEyeStatus: {
      message: 'Possible statuses are: "shown", "rejected", "engaged"',
    },
    wrongEagleEyeSearch: {
      message: 'Wrong search parameters',
    },
    projectNotFound: {
      message: 'Project not found',
    },

    integrations: {
      badEndpoint: 'Bad endpoint: {0}',
    },
    sentiment: {
      mood: 'Invalid sentiment data. The {1} property must exist and be a number.',
      label:
        "Invalid sentiment data. The 'label' property must exist and be one of 'positive' | 'negative' | 'mixed' | 'neutral'.",
      sentiment: "Invalid sentiment data. The 'sentiment' property must exist and be a number.",
    },
  },

  email: {
    error: `Email provider is not configured.`,
  },

  preview: {
    error: 'Sorry, this operation is not allowed.',
  },

  entities: {
    member: {
      errors: {
        unique: {
          username: 'Username must be unique',
          email: 'Email must be unique',
        },
      },
    },
    activity: {
      errors: {
        platformAndUsernameNotMatching: 'Given platform and username object can not be mapped',
        platformRequiredWhileUpsert: 'Platform is required while upserting a member',
        unique: {},
      },
    },
    tag: {
      errors: {
        unique: {},
      },
    },
  },
}

export default en
