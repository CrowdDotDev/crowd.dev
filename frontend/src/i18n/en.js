const en = {
  common: {
    or: 'or',
    cancel: 'Cancel',
    reset: 'Reset',
    save: 'Save',
    search: 'Search',
    edit: 'Edit',
    remove: 'Remove',
    new: 'New',
    export: 'Export to Excel',
    noDataToExport: 'No data to export',
    import: 'Import',
    discard: 'Discard',
    yes: 'Yes',
    no: 'No',
    pause: 'Pause',
    areYouSure: 'Are you sure?',
    view: 'View',
    destroy: 'Delete',
    mustSelectARow: 'Must select a row',
    confirm: 'Confirm',
    connect: 'Connect',
    filters: {
      active: 'Active Filters',
      hide: 'Hide Filters',
      show: 'Show Filters',
      apply: 'Apply Filters',
    },
  },

  app: {
    title: 'crowd.dev',
  },

  api: {
    menu: 'API',
  },

  entities: {
    project: {
      name: 'project',
      label: 'Projects',
      menu: 'Projects',
      exporterFileName: 'project_export',
      list: {
        menu: 'Projects',
        title: 'Projects',
      },
      create: {
        success: 'Project successfully saved',
      },
      update: {
        success: 'Project successfully saved',
      },
      destroy: {
        success: 'Project successfully deleted',
      },
      destroyAll: {
        success: 'Project(s) successfully deleted',
      },
      edit: {
        title: 'Edit Project',
      },
      fields: {
        id: 'Id',
        name: 'Name',
        repos: 'Repos',
        integrations: 'Integrations',
        info: 'Custom Attributes',
        activities: 'Activities',
        members: 'Members',
        latestMetrics: 'LatestMetrics',
        membersToMerge: 'Members To Merge',
        benchmarkRepos: 'BenchmarkRepos',
        createdAt: 'Created at',
        updatedAt: 'Updated at',
        createdAtRange: 'Created at',
      },
      enumerators: {},
      placeholders: {},
      hints: {},
      new: {
        title: 'New Project',
      },
      view: {
        title: 'View Project',
      },
    },

    repo: {
      name: 'repo',
      label: 'Repos',
      menu: 'Repos',
      exporterFileName: 'repo_export',
      list: {
        menu: 'Repos',
        title: 'Repos',
      },
      create: {
        success: 'Repo successfully saved',
      },
      update: {
        success: 'Repo successfully saved',
      },
      destroy: {
        success: 'Repo successfully deleted',
      },
      destroyAll: {
        success: 'Repo(s) successfully deleted',
      },
      edit: {
        title: 'Edit Repo',
      },
      fields: {
        id: 'Id',
        url: 'URL',
        network: 'Network',
        info: 'Custom Attributes',
        project: 'Project',
        createdAt: 'Created at',
        updatedAt: 'Updated at',
        createdAtRange: 'Created at',
      },
      enumerators: {},
      placeholders: {},
      hints: {},
      new: {
        title: 'New Repo',
      },
      view: {
        title: 'View Repo',
      },
    },

    emailDigest: {
      fields: {
        email: 'Email',
        frequency: 'Frequency',
        time: 'Time',
      },
    },
    member: {
      name: 'member',
      label: 'Members',
      menu: 'Members',
      exporterFileName: 'member_export',
      list: {
        menu: 'Members',
        title: 'Members',
      },
      create: {
        success: 'Member successfully saved',
        error: 'There was an error creating the member',
      },
      update: {
        success: 'Member successfully saved',
        error: 'There was an error updating the member',
      },
      destroy: {
        success: 'Member successfully deleted',
      },
      destroyAll: {
        success: 'Member(s) successfully deleted',
      },
      edit: {
        title: 'Edit Member',
      },
      merge: {
        title: 'Merge Member',
        success: 'Members merged successfully',
      },
      attributes: {
        error: 'Custom Attributes could not be created',
        success: 'Custom Attributes successfuly updated',
      },
      fields: {
        id: 'Id',
        fullName: 'Full Name',
        jobTitle: 'Job title',
        company: 'Company',
        member: 'Member',
        score: 'Score',
        estimatedReach: 'Estimated Reach',
        numberActivities: '# of Activities',
        contact: 'Contact',
        tag: 'Tags',
        username: 'Username',
        displayName: 'Display Name',
        activities: 'Activities',
        activityCount: '# of activities',
        numberOfOpenSourceContributions: '# of open source contributions',
        activityTypes: 'Activity type',
        location: 'Location',
        organization: 'Organization',
        organizations: 'Organizations',
        signal: 'Signal',
        bio: 'Bio',
        projects: 'Projects',
        info: 'Custom Attributes',
        followers: 'Followers',
        following: 'Following',
        tags: 'Tags',
        email: 'Email',
        noMerge: 'NoMerge',
        crowdInfo: 'CrowdInfo',
        reach: 'Reach',
        joinedAt: 'Member since',
        createdAt: 'Created at',
        updatedAt: 'Updated at',
        createdAtRange: 'Created at',
        identities: 'Identities',
        activeOn: 'Active On',
      },
      enumerators: {},
      placeholders: {},
      hints: {},
      new: {
        title: 'New Member',
      },
      view: {
        title: 'View Member',
      },
    },

    note: {
      fields: {
        id: 'ID',
        body: 'Note',
      },
    },

    organization: {
      name: 'organization',
      label: 'Organizations',
      menu: 'Organizations',
      create: {
        success: 'Organization successfully saved',
        error:
          'There was an error creating the organization',
      },
      update: {
        success: 'Organization successfully saved',
        error:
          'There was an error updating the organization',
      },
      destroy: {
        success: 'Organization successfully deleted',
      },
      destroyAll: {
        success: 'Organization(s) successfully deleted',
      },
      edit: {
        title: 'Edit Organization',
      },
      fields: {
        name: 'Name',
        description: 'Description',
        website: 'Website',
        location: 'Location',
        employees: 'Number of employees',
        revenueRange: 'Annual revenue',
        activeSince: 'Active since',
        github: 'GitHub',
        twitter: 'Twitter',
        linkedin: 'LinkedIn',
        crunchbase: 'Crunchbase',
      },
    },

    activity: {
      name: 'activity',
      label: 'Activities',
      menu: 'Activities',
      exporterFileName: 'activity_export',
      list: {
        menu: 'Activities',
        title: 'Activities',
      },
      create: {
        success: 'Activity successfully saved',
      },
      update: {
        success: 'Activity successfully saved',
      },
      destroy: {
        success: 'Activity successfully deleted',
      },
      destroyAll: {
        success: 'Activity(s) successfully deleted',
      },
      edit: {
        title: 'Edit Activity',
      },
      fields: {
        id: 'Id',
        type: 'Activity type',
        timestampRange: 'Timestamp',
        timestamp: 'Timestamp',
        platform: 'Platform',
        project: 'Project',
        info: 'Custom Attributes',
        member: 'Member',
        isContribution: 'Key Action',
        crowdInfo: 'CrowdInfo',
        createdAt: 'Created at',
        updatedAt: 'Updated at',
        date: 'Date',
        createdAtRange: 'Created at',
      },
      enumerators: {},
      placeholders: {},
      hints: {},
      new: {
        title: 'New Activity',
      },
      view: {
        title: 'View Activity',
      },
    },

    report: {
      name: 'Reports',
      label: 'Reports',
      menu: 'Reports',
      edit: {
        title: 'Edit Report',
      },
      new: {
        title: 'New Report',
      },
      view: {
        title: 'View Report',
      },
      exporterFileName: 'report_export',
      list: {
        menu: 'Reports',
        title: 'Reports',
      },
      create: {
        success: 'Report successfully saved',
      },
      update: {
        success: 'Report successfully saved',
      },
      destroy: {
        success: 'Report successfully deleted',
      },
      destroyAll: {
        success: 'Report(s) successfully deleted',
      },
      fields: {
        name: 'Name',
        public: 'Public',
      },
    },

    eagleEye: {
      name: 'Eagle Eye',
      label: 'Eagle Eye',
      menu: 'Eagle Eye',
    },

    automation: {
      name: 'Automations',
      label: 'Automations',
      create: {
        success: 'Automation successfully saved',
      },
      update: {
        success: 'Automation successfully saved',
      },
      destroy: {
        success: 'Automation successfully deleted',
      },
      destroyAll: {
        success: 'Automation(s) successfully deleted',
      },
      fields: {
        type: 'Type',
        trigger: 'Choose Trigger',
        status: 'Status',
      },
      triggers: {
        new_activity:
          'New activity happened in your community',
        new_member: 'New member joined your community',
      },
    },

    conversation: {
      name: 'Conversations',
      label: 'Conversations',
      edit: {
        title: 'Edit Conversation',
      },
      new: {
        title: 'New Conversation',
      },
      view: {
        title: 'View Conversation',
      },
      exporterFileName: 'conversation_export',
      list: {
        menu: 'Conversations',
        title: 'Conversations',
      },
      create: {
        success: 'Conversation successfully saved',
      },
      update: {
        success: 'Conversation successfully saved',
      },
      destroy: {
        success: 'Conversation successfully deleted',
      },
      destroyAll: {
        success: 'Conversation(s) successfully deleted',
      },
      fields: {
        title: 'Title',
        platform: 'Platform',
        channel: 'Channel',
        published: 'Published',
        activityCount: '# of activities',
        createdAt: 'Date started',
        lastActive: 'Last activity',
      },
    },
  },

  widget: {
    cubejs: {
      tooltip: {
        Activities: 'Activity',
        Members: 'Member',
        Conversations: 'Conversation',
        Organizations: 'Organization',
      },
      cubes: {
        Activities: 'Activities',
        Members: 'Members',
        Conversations: 'Conversations',
        Organizations: 'Organizations',
      },
      Activities: {
        count: '[Activities] Count',
        cumulativeCount: '[Activities] Cumulative Count',
        type: '[Activities] Type',
        platform: '[Activities] Platform',
        date: '[Activities] Date',
        channel: '[Activities] Channel',
      },
      Members: {
        count: '[Members] Count',
        cumulativeCount: '[Members] Cumulative Count',
        score: '[Members] Engagement Level',
        location: '[Members] Location',
        organization: '[Members] Organization',
        joinedAt: '[Members] Joined Date',
      },
      MemberTags: {
        count: '[Members] # of Tags',
      },
      Conversations: {
        count: '[Conversations] Count',
        createdat: '[Conversations] Date',
        lastactive: '[Conversations] Last Active',
        platform: '[Conversations] Platform',
        category: '[Conversations] Category',
        published: '[Conversations] Published',
      },
      Tags: {
        name: '[Tags] Name',
        count: '[Tags] Count',
      },
      Identities: {
        count: '[Identities] Count',
      },
      Organizations: {
        count: '[Organizations] Count',
        createdat: '[Organizations] Date',
      },
      Segments: {
        count: '[Segments] Count',
        name: '[Segments] Name',
      },
      Sentiment: {
        averageSentiment: '[Sentiment] Average',
        date: '[Sentiment] Date',
        platform: '[Sentiment] Platform',
      },
    },
  },

  auth: {
    tenants: 'Workspaces',
    profile: {
      title: 'Profile settings',
      success: 'Profile successfully updated',
    },
    createAnAccount: 'Create an account',
    rememberMe: 'Remember me',
    forgotPassword: 'Forgot password',
    signin: 'Sign in',
    signup: 'Sign up',
    signout: 'Sign out',
    alreadyHaveAnAccount:
      'Already have an account? Sign in.',
    social: {
      errors: {
        'auth-invalid-provider':
          'This email is already registered to another provider.',
        'auth-no-email': 'The email associated with this account is private or inexistent.',
      },
    },
    signinWithAnotherAccount:
      'Sign in with another account',
    emailUnverified: {
      message: 'Please confirm your email at <strong>{0}</strong> to continue.',
      submit: 'Resend email verification',
    },
    emptyPermissions: {
      message: 'You have no permissions yet. Wait for the admin to grant you privileges.',
    },
    passwordResetEmail: {
      message: 'Send password reset e-mail',
      error: 'Email not recognized',
    },
    passwordReset: {
      message: 'Reset password',
    },
    passwordChange: {
      title: 'Change Password',
      success: 'Password successfully changed',
      mustMatch: 'Passwords do not match',
    },
    emailAddressVerificationEmail: {
      error: 'Email not recognized',
    },
    verificationEmailSuccess: 'Verification email successfully sent',
    passwordResetEmailSuccess: 'Password reset email successfully sent',
    passwordResetSuccess: 'Password successfully changed',
    verifyEmail: {
      success: 'Email successfully verified.',
      message:
        'Just a moment, your email is being verified...',
    },
  },

  roles: {
    admin: {
      label: 'Admin',
      description: 'Full access to all resources',
    },
    readonly: {
      label: 'Read-only',
      description:
        'Read access to Community Members, Activities, Conversations, and Reports',
    },
  },

  user: {
    fields: {
      id: 'Id',
      avatars: 'Avatar',
      email: 'E-mail',
      emails: 'Email(s)',
      fullName: 'Name',
      firstName: 'First name',
      lastName: 'Last name',
      acceptedTermsAndPrivacy: 'Terms and privacy',
      status: 'Status',
      phoneNumber: 'Phone Number',
      role: 'Role',
      createdAt: 'Created at',
      updatedAt: 'Updated at',
      roleUser: 'Role/User',
      roles: 'Roles',
      createdAtRange: 'Created at',
      password: 'Password',
      passwordConfirmation: 'Confirm password',
      oldPassword: 'Old password',
      newPassword: 'New password',
      newPasswordConfirmation: 'Confirm new password',
      rememberMe: 'Remember me',
    },
    status: {
      active: 'Active',
      invited: 'Invite sent',
      'empty-permissions': 'Waiting for Permissions',
    },
    invite: 'Invite',
    validations: {
      email: 'Email {value} is invalid',
    },
    title: 'Users',
    menu: 'Users',
    doAddSuccess: 'User successfully invited',
    doUpdateSuccess: 'User successfully updated',
    exporterFileName: 'users_export',
    doDestroySuccess: 'User successfully deleted',
    doDestroyAllSuccess: 'Users successfully deleted',
    edit: {
      title: 'Edit User',
    },
    new: {
      title: 'Invite User(s)',
      titleModal: 'Invite User',
      emailsHint:
        'Separate multiple email addresses using the comma character.',
    },
    view: {
      title: 'View User',
      activity: 'Activity',
    },
    errors: {
      userAlreadyExists:
        'User with this email already exists',
      userNotFound: 'User not found',
      revokingOwnPermission: 'You can\'t revoke your own admin permission',
    },
  },

  tenant: {
    name: 'tenant',
    label: 'Workspaces',
    menu: 'Manage workspaces',
    list: {
      menu: 'Workspaces',
      title: 'Workspaces',
    },
    create: {
      button: 'Create Workspace',
      success: 'Community has been created',
    },
    update: {
      success: 'Community has been updated',
    },
    destroy: {
      success: 'Community successfully deleted',
    },
    destroyAll: {
      success: 'Workspace(s) successfully deleted',
    },
    edit: {
      title: 'Edit Workspace',
    },
    fields: {
      id: 'Id',
      name: 'Name',
      url: 'URL',
      tenantUrl: 'Community URL',
      tenantName: 'Community name',
      tenantPlatforms: 'Community platforms',
      tenantSize: 'Community size',
      tenantId: 'Community',
      plan: 'Plan',
    },
    enumerators: {},
    new: {
      title: 'New Workspace',
    },
    invitation: {
      view: 'View Invitations',
      invited: 'Invited',
      accept: 'Accept Invitation',
      decline: 'Decline Invitation',
      declined: 'Invitation successfully declined',
      acceptWrongEmail: 'Accept Invitation With This Email',
    },
    select: 'Select Workspace',
    validation: {
      url: 'Your workspace URL can only contain lowercase letters, numbers and dashes (and must start with a letter or number).',
    },
  },

  plan: {
    menu: 'Plans',
    title: 'Plans',

    free: {
      label: 'Free',
      price: '$0',
    },
    premium: {
      label: 'Premium',
      price: '$10',
    },
    enterprise: {
      label: 'Enterprise',
      price: '$50',
    },

    pricingPeriod: '/month',
    current: 'Current Plan',
    subscribe: 'Subscribe',
    manage: 'Manage Subscription',
    cancelAtPeriodEnd:
      'This plan will be canceled at the end of the period.',
    somethingWrong:
      'There is something wrong with your subscription. Please go to manage subscription for more details.',
    notPlanUser: 'You are not the manager of this subscription.',
  },

  auditLog: {
    menu: 'Audit Logs',
    title: 'Audit Logs',
    exporterFileName: 'audit_log_export',
    entityNamesHint:
      'Separate multiple entities using the comma character.',
    fields: {
      id: 'Id',
      timestampRange: 'Period',
      entityName: 'Entity',
      entityNames: 'Entities',
      entityId: 'Entity ID',
      action: 'Action',
      values: 'Values',
      timestamp: 'Date',
      createdByEmail: 'User Email',
    },
  },
  settings: {
    title: 'Settings',
    menu: 'Settings',
    save: {
      success:
        'Settings successfully saved. The page will reload in {0} seconds for changes to take effect.',
    },
    fields: {
      theme: 'Theme',
      logos: 'Logo',
      backgroundImages: 'Background Image',
    },
    colors: {
      default: 'Default',
      cyan: 'Cyan',
      'geek-blue': 'Geek Blue',
      gold: 'Gold',
      lime: 'Lime',
      magenta: 'Magenta',
      orange: 'Orange',
      'polar-green': 'Polar Green',
      purple: 'Purple',
      red: 'Red',
      volcano: 'Volcano',
      yellow: 'Yellow',
    },
  },
  feedback: {
    menu: 'Feedback',
  },
  integrations: {
    menu: 'Integrations',
  },
  dashboard: {
    menu: 'Home',
    message: 'This page uses fake data for demonstration purposes only. You can edit it at '
      + 'frontend/src/modules/dashboard/components/dashboard-page.vue.',
    charts: {
      day: 'Day',
      red: 'Red',
      green: 'Green',
      yellow: 'Yellow',
      grey: 'Grey',
      blue: 'Blue',
      orange: 'Orange',
      months: {
        1: 'January',
        2: 'February',
        3: 'March',
        4: 'April',
        5: 'May',
        6: 'June',
        7: 'July',
      },
      eating: 'Eating',
      drinking: 'Drinking',
      sleeping: 'Sleeping',
      designing: 'Designing',
      coding: 'Coding',
      cycling: 'Cycling',
      running: 'Running',
      customer: 'Customer',
    },
  },
  errors: {
    backToHome: 'Back to home',
    403: 'Sorry, you don\'t have access to this page',
    404: 'Sorry, the page you visited does not exist',
    500: 'Sorry, the server is reporting an error',
    429: 'Too many requests. Please try again later.',
    forbidden: {
      message: 'Forbidden',
    },
    validation: {
      message: 'An error occurred',
    },
    defaultErrorMessage: 'Ops, an error occurred',
  },

  preview: {
    error:
      'Sorry, this operation is not allowed in preview mode.',
  },

  // See https://github.com/jquense/yup#using-a-custom-locale-dictionary
  /* eslint-disable */
  validation: {
    mixed: {
      default: 'path} is invalid',
      required: 'This field is required',
      oneOf:
        '{path} must be one of the following values: ${values}',
      notOneOf:
        '{path} must not be one of the following values: ${values}',
      notType: ({ path, type, value, originalValue }) => {
        return `${path} must be a ${type}`
      }
    },
    string: {
      length:
        '{path} must be exactly ${length} characters',
      min: '{path} must be at least ${min} characters',
      max: '{path} must be at most ${max} characters',
      matches:
        '{path} must match the following: "${regex}"',
      email: '{path} must be a valid email',
      url: '{path} must be a valid URL',
      trim: '{path} must be a trimmed string',
      lowercase: '{path} must be a lowercase string',
      uppercase: '{path} must be a upper case string',
      selected: '{path} must be selected'
    },
    number: {
      min: '{path} must be greater than or equal to ${min}',
      max: '{path} must be less than or equal to ${max}',
      lessThan: '{path} must be less than ${less}',
      moreThan: '{path} must be greater than ${more}',
      notEqual: '{path} must be not equal to ${notEqual}',
      positive: '{path} must be a positive number',
      negative: '{path} must be a negative number',
      integer: '{path} must be an integer',
      invalid: '{path} must be a number'
    },
    date: {
      min: '{path} field must be later than ${min}',
      max: '{path} field must be at earlier than ${max}'
    },
    boolean: {},
    object: {
      noUnknown:
        '{path} field cannot have keys not specified in the object shape'
    },
    array: {
      min: '{path} field must have at least ${min} items',
      max: '{path} field must have less than or equal to ${max} items'
    }
  },
  /* eslint-disable */
  fileUploader: {
    upload: 'Upload',
    image: 'You must upload an image',
    size: 'File is too big. Max allowed size is {0}',
    formats: `Invalid format. Must be one of: {0}.`
  },

  autocomplete: {
    loading: 'Loading...'
  },

  imagesViewer: {
    noImage: 'No image'
  },

  external: {
    docs: 'Documentation',
    community: 'Community'
  }
}

export default en
