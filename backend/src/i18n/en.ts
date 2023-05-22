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
        priorityArrayNotFound: `Member attributes platform priority array does not exist.`,
        reservedField: `Cannot use reserved field '{0}' for dynamic attributes.`,
      },
    },
    activityTypes: {
      errors: {
        typeRequiredWhenCreating: `Type field is required when creating a custom activity type.`,
        typeRequiredWhenUpdating: `Type field is required when updating a custom activity type.`,
        notFound: `Activity type with key {0} is not found.`,
      },
    },
    activityChannels: {
      errors: {
        typeRequiredWhenCreating: `Type field is required when creating a custom activity channel.`,
        notFound: `Activity type with key {0} is not found.`,
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

  task: {
    errors: {
      unknownBatchOperation: 'Sent batch operation {0} is unknown.',
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
      nameRequiredOnCreate: 'Name is required on tenant creation.',
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
    OrganizationNameRequired: {
      message: 'Organization Name is required',
    },
    projectNotFound: {
      message: 'Project not found',
    },
    eagleEye: {
      urlRequiredWhenUpserting: 'URL field is mandatory when upserting eagleEyeContent',
      contentNotFound: 'Eagle eye content not found. Action will not be created.',
      feedSettingsMissing: 'Feed settings are missing. Settings not updated.',
      keywordsMissing:
        'Either keywords or exactKeywords are required in feeds. Settings not updated.',
      platformMissing:
        'feed.platforms is required and must be a non-empty list. Settings not updated.',
      platformInvalid: `feed.platforms contains {0}, which is not in [{1}]. Settings not updated.`,
      publishedDateMissing:
        'feed.publishedDate is missing or invalid. It should be one of [{0}]. Settings not updated.',
      emailInvalid: 'emailDigest.email needs a valid email address. Settings not updated.',
      frequencyInvalid:
        'emailDigest.frequency needs to be one of daily, weekly. Settings not updated.',
      timeInvalid: 'emailDigest.time needs to be a valid time. Settings not updated.',
      notOnboarded: 'Eagle eye is not set up yet.',
      invalidEvent: 'Invalid event type.',
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
    csvExport: {
      planLimitExceeded: 'You have exceeded # of csv exports you can have per month in your plan.',
    },
    reports: {
      templateReportsCreateNotAllowed: `Template reports can't be created.`,
      templateReportsUpdateNotAllowed: `Custom reports can't be updated to template reports.`,
    },
    noNangoToken: {
      message: 'No Nango token found!',
    },
    linkedin: {
      noOrganization: 'User does not belong to any organization!',
      cantOnboardWrongStatus:
        'Can not trigger nboarding because integration is not in state pending-action!',
      noOrganizationFound: 'No organization found for given id!',
    },
    members: {
      activeList: {
        activityTimestampFrom: 'activityTimestampFrom is required query parameter!',
        activityTimestampTo: 'activityTimestampTo is required query parameter!',
      },
    },
    git: {
      noIntegration: 'The Git integration is not configured.',
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
          platform: 'Member with the same platform and username already exists in this tenant.',
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
    integration: {
      name: {
        github: 'GitHub',
        linkedin: 'LinkedIn',
        twitter: 'Twitter',
        devto: 'DEV',
        stackoverflow: 'Stack Overflow',
        reddit: 'Reddit',
        discord: 'Discord',
        slack: 'Slack',
        hackernews: 'Hacker News',
        discourse: 'Discourse',
      },
    },
    automation: {
      errors: {
        planLimitExceeded: 'You have exceeded # of automations you can have in your plan.',
      },
    },
    eagleEye: {
      errors: {
        planLimitExceeded:
          'EagleEye is only available in the Growth and Custom plans. Please upgrade your plan.',
      },
    },
  },

  communityHelpCenter: {
    errors: {
      planNotSupportingCustomUrls: "Your plan {0} doesn't include custom urls.",
    },
  },

  enrichment: {
    errors: {
      planLimitExceeded:
        'You have exceeded # of member enrichments you can have per month in your plan.',
      requestedEnrichmentMoreThanLimit:
        'You have requested more member enrichments than your available limit.',
      enrichmentFailed: 'Failed to call the enrichment API',
      noGithubHandleOrEmail:
        'No GitHub handle or email found. We can only enrich profiles with GitHub handles or emails.',
      memberNotFound:
        'Member not found in the enrichment database. This did not affect your quota.',
    },
  },
}

export default en
