const es = {
  common: {
    or: 'o',
    cancel: 'Cancelar',
    reset: 'Reiniciar',
    save: 'Guardar',
    search: 'Buscar',
    edit: 'Editar',
    remove: 'Eliminar',
    new: 'Nuevo',
    export: 'Exportar a Excel',
    noDataToExport: 'No hay datos para exportar',
    import: 'Importar',
    discard: 'Descartar',
    yes: 'Si',
    no: 'No',
    pause: 'Pausa',
    areYouSure: '¿Estás seguro?',
    view: 'Ver',
    destroy: 'Eliminar',
    mustSelectARow: 'Debe seleccionar una fila',
    confirm: 'Confirmar',
    start: 'Comienzo',
    end: 'Final',
    filters: {
      // TODO: Translate these
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
      exporterFileName: 'exportacion_project',
      list: {
        menu: 'Projects',
        title: 'Projects',
      },
      create: {
        success: 'Project guardado con éxito',
      },
      update: {
        success: 'Project guardado con éxito',
      },
      destroy: {
        success: 'Project eliminado con éxito',
      },
      destroyAll: {
        success: 'Project(s) eliminado con éxito',
      },
      edit: {
        title: 'Editar Project',
      },
      fields: {
        id: 'Id',
        name: 'Name',
        repos: 'Repos',
        integrations: 'Integrations',
        info: 'Info',
        activities: 'Activities',
        communityMembers: 'Members',
        latestMetrics: 'LatestMetrics',
        membersToMerge: 'Members To Merge',
        benchmarkRepos: 'BenchmarkRepos',
        createdAt: 'Creado el',
        updatedAt: 'Actualizado el',
        createdAtRange: 'Creado el',
      },
      enumerators: {},
      placeholders: {},
      hints: {},
      new: {
        title: 'Nuevo Project',
      },
      view: {
        title: 'Ver Project',
      },
    },

    repo: {
      name: 'repo',
      label: 'Repos',
      menu: 'Repos',
      exporterFileName: 'exportacion_repo',
      list: {
        menu: 'Repos',
        title: 'Repos',
      },
      create: {
        success: 'Repo guardado con éxito',
      },
      update: {
        success: 'Repo guardado con éxito',
      },
      destroy: {
        success: 'Repo eliminado con éxito',
      },
      destroyAll: {
        success: 'Repo(s) eliminado con éxito',
      },
      edit: {
        title: 'Editar Repo',
      },
      fields: {
        id: 'Id',
        url: 'URL',
        network: 'Network',
        info: 'Info',
        project: 'Project',
        createdAt: 'Creado el',
        updatedAt: 'Actualizado el',
        createdAtRange: 'Creado el',
      },
      enumerators: {},
      placeholders: {},
      hints: {},
      new: {
        title: 'Nuevo Repo',
      },
      view: {
        title: 'Ver Repo',
      },
    },

    communityMember: {
      name: 'communityMember',
      label: 'Members',
      menu: 'Members',
      exporterFileName: 'exportacion_communityMember',
      list: {
        menu: 'Members',
        title: 'Members',
      },
      create: {
        success: 'Member guardado con éxito',
      },
      update: {
        success: 'Member guardado con éxito',
      },
      destroy: {
        success: 'Member eliminado con éxito',
      },
      destroyAll: {
        success: 'Member(s) eliminado con éxito',
      },
      edit: {
        title: 'Editar Member',
      },
      merge: {
        title: 'Merge Member',
        success: 'Members merged successfully',
      },
      fields: {
        // TODO: Translate these
        id: 'Id',
        member: 'Member',
        score: 'Score',
        estimatedReach: 'Estimated Reach',
        numberActivities: '# of Activities',
        numberOfOpenSourceContributions: '# of open source contributions',
        contact: 'Contact',
        tag: 'Tags',
        username: 'Username',
        activities: 'Activities',
        projects: 'Projects',
        info: 'Info',
        followers: 'Followers',
        following: 'Following',
        tags: 'Tags',
        email: 'Email',
        noMerge: 'NoMerge',
        crowdInfo: 'CrowdInfo',
        createdAt: 'Created at',
        updatedAt: 'Updated at',
        createdAtRange: 'Created at',
      },
      enumerators: {},
      placeholders: {},
      hints: {},
      new: {
        title: 'Nuevo Member',
      },
      view: {
        title: 'Ver Member',
      },
    },

    activity: {
      name: 'activity',
      label: 'Activities',
      menu: 'Activities',
      exporterFileName: 'exportacion_activity',
      list: {
        menu: 'Activities',
        title: 'Activities',
      },
      create: {
        success: 'Activity guardado con éxito',
      },
      update: {
        success: 'Activity guardado con éxito',
      },
      destroy: {
        success: 'Activity eliminado con éxito',
      },
      destroyAll: {
        success: 'Activity(s) eliminado con éxito',
      },
      edit: {
        title: 'Editar Activity',
      },
      fields: {
        id: 'Id',
        type: 'Type',
        timestampRange: 'Timestamp',
        timestamp: 'Timestamp',
        platform: 'Platform',
        project: 'Project',
        info: 'Info',
        communityMember: 'Member',
        isContribution: 'Contribution',
        crowdInfo: 'CrowdInfo',
        createdAt: 'Creado el',
        updatedAt: 'Actualizado el',
        createdAtRange: 'Creado el',
      },
      enumerators: {},
      placeholders: {},
      hints: {},
      new: {
        title: 'Nuevo Activity',
      },
      view: {
        title: 'Ver Activity',
      },
      github: {
        // TODO: Translate these
        fork: 'forked a repository',
        star: 'stared a repository',
        unstar: 'unstared a repository',
        'pull_request-open': 'opened a new pull request',
        'pull_request-close': 'closed a pull request',
        'issues-open': 'opened a new issue',
        'issues-close': 'closed an issue',
        'issue-comment': 'commented an issue',
        'commit-comment': 'commented a commit',
        'pull_request-comment': 'commented a pull request',
      },
    },

    report: {
      menu: 'Analytics',
    },
  },
  auth: {
    tenants: 'Espacios de trabajo',
    profile: {
      title: 'Perfil',
      success: 'Perfil actualizado con éxito',
    },
    createAnAccount: 'Crea una cuenta',
    rememberMe: 'Recuérdame',
    forgotPassword: 'Se te olvidó tu contraseña',
    signin: 'Iniciar Sesión',
    signup: 'Registrarse',
    signout: 'Desconectar',
    alreadyHaveAnAccount:
      '¿Ya tienes una cuenta? Registrarse.',
    social: {
      errors: {
        'auth-invalid-provider':
          'This email is already registered to another provider.',
        'auth-no-email': 'The email associated with this account is private or inexistent.',
      },
    },
    signinWithAnotherAccount:
      'Inicia sesión con otra cuenta',
    passwordChange: {
      title: 'Cambia la contraseña',
      success: 'Contraseña cambiada correctamente',
      mustMatch: 'Las contraseñas deben coincidir',
    },
    emailUnverified: {
      message:
        'Confirme su correo electrónico en <strong>{0}</strong> para continuar.',
      submit: 'Reenviar verificación de correo electrónico',
    },
    emptyPermissions: {
      message:
        'Aún no tienes permisos. Espera a que el administrador te otorgue privilegios.',
    },
    passwordResetEmail: {
      message:
        'Enviar contraseña restablecer correo electrónico',
      error: 'Correo electrónico no reconocido',
    },
    passwordReset: {
      message: 'Restablecer la contraseña',
    },
    emailAddressVerificationEmail: {
      error: 'Correo electrónico no reconocido',
    },
    verificationEmailSuccess:
      'Correo electrónico de verificación enviado con éxito',
    passwordResetEmailSuccess:
      'Correo electrónico de restablecimiento de contraseña enviado correctamente',
    passwordResetSuccess:
      'Contraseña cambiada correctamente',
    verifyEmail: {
      success: 'Correo electrónico verificado con éxito.',
      message:
        'Solo un momento, su correo electrónico está siendo verificado ...',
    },
  },
  tenant: {
    name: 'inquilino',
    label: 'Espacios de trabajo',
    menu: 'Espacios de trabajo',
    list: {
      menu: 'Espacios de trabajo',
      title: 'Espacios de trabajo',
    },
    create: {
      button: 'Crear espacio de trabajo',
      success: 'Espacio de trabajo guardado correctamente',
    },
    update: {
      success: 'Espacio de trabajo guardado correctamente',
    },
    destroy: {
      success: 'Espacio de trabajo eliminado correctamente',
    },
    destroyAll: {
      success:
        'Espacio(s) de trabajo eliminado(s) correctamente',
    },
    edit: {
      title: 'Editar espacio de trabajo',
    },
    fields: {
      id: 'Id',
      name: 'Nombre',
      url: 'URL',
      tenantName: 'Nombre del espacio de trabajo',
      tenantId: 'Espacio de trabajo',
      tenantUrl: 'URL del espacio de trabajo',
      plan: 'Plan',
    },
    enumerators: {},
    new: {
      title: 'Nuevo espacio de trabajo',
    },
    invitation: {
      view: 'Ver invitaciones',
      invited: 'Invitado',
      accept: 'Aceptar la invitacion',
      decline: 'Rechazar invitación',
      declined: 'Invitación rechazada con éxito',
      acceptWrongEmail:
        'Aceptar invitación con este correo electrónico',
    },
    select: 'Seleccionar espacio de trabajo',
    validation: {
      url: 'La URL de su espacio de trabajo solo puede contener letras minúsculas, números y guiones (y debe comenzar con una letra o número).',
    },
  },
  roles: {
    admin: {
      label: 'Administración',
      description: 'Acceso total a todos los recursos.',
    },
    custom: {
      label: 'Rol personalizado',
      description: 'Acceso personalizado a recursos',
    },
  },
  user: {
    invite: 'Invitación',
    title: 'Usuarios',
    menu: 'Usuarios',
    fields: {
      id: 'Id',
      avatars: 'Avatar',
      email: 'Email',
      emails: 'Email(s)',
      fullName: 'Nombre completo',
      firstName: 'Nombre',
      lastName: 'Apellido',
      status: 'Estado',
      disabled: 'Discapacitado',
      phoneNumber: 'Número de teléfono',
      role: 'Rol',
      createdAt: 'Creado el',
      updatedAt: 'Actualizado el',
      roleUser: 'Rol/Usuario',
      roles: 'Roles',
      createdAtRange: 'Creado el',
      password: 'Contraseña',
      rememberMe: 'Recuérdame',
      oldPassword: 'Contraseña anterior',
      newPassword: 'Nueva contraseña',
      newPasswordConfirmation:
        'Nueva confirmación de contraseña',
    },
    enabled: 'Habilitado',
    disabled: 'Discapacitado',
    validations: {
      email: 'El correo electrónico {value} no es válido',
    },
    disable: 'Inhabilitar',
    enable: 'Habilitar',
    doEnableSuccess: 'Usuario habilitado con éxito',
    doDisableSuccess: 'Usuario deshabilitado con éxito',
    doDisableAllSuccess:
      'Usuario(s) deshabilitado con éxito',
    doEnableAllSuccess:
      'Usuario(s) habilitados correctamente',
    doAddSuccess: 'Usuario(s) guardado correctamente',
    doUpdateSuccess: 'Usuario guardado con éxito',
    status: {
      active: 'Activo',
      invited: 'Invitado',
      'empty-permissions': 'Esperando permisos',
    },
    exporterFileName: 'usuarios_exportacion',
    doDestroySuccess: 'Usuario eliminado con éxito',
    doDestroyAllSelectedSuccess:
      'Usuario(s) eliminado correctamente',
    edit: {
      title: 'Editar Usuario',
    },
    new: {
      title: 'Invitar Usuario(s)',
      titleModal: 'Nuevo Usuario',
      emailsHint:
        'Separe varias direcciones de correo electrónico utilizando el carácter de coma.',
    },
    view: {
      title: 'Ver Usuario',
      activity: 'Actividad',
    },
    errors: {
      userAlreadyExists:
        'El usuario con este correo electrónico ya existe',
      userNotFound: 'Usuario no encontrado',
      disablingHimself: 'No puedes inhabilitarte',
      revokingOwnPermission:
        'No puede revocar su propio permiso de administrador',
    },
  },
  plan: {
    menu: 'Planes',
    title: 'Planes',
    free: {
      label: 'Gratis',
      price: '$0',
    },
    premium: {
      label: 'Crecimiento',
      price: '$10',
    },
    enterprise: {
      label: 'Empresa',
      price: '$50',
    },
    pricingPeriod: '/mes',
    current: 'Plan Actual',
    subscribe: 'Suscribir',
    manage: 'Administrar Suscripción',
    cancelAtPeriodEnd:
      'Este plan se cancelará al final del período.',
    somethingWrong:
      'Hay algo mal con su suscripción. Vaya a administrar la suscripción para obtener más detalles.',
    notPlanUser:
      'No eres el administrador de esta suscripción.',
    demoHintHtml:
      'Sugerencia: Use esas <a href="https://stripe.com/docs/testing#cards" target="_blank" rel="noopener noreferrer">tarjetas de prueba</a> para la demostración.',
  },
  auditLog: {
    menu: 'Registros de auditoría',
    title: 'Registros de auditoría',
    exporterFileName: 'audit_log_export',
    entityNamesHint:
      'Separe varias entidades con el carácter de coma.',
    fields: {
      id: 'Id',
      timestampRange: 'Período',
      entityName: 'Entidad',
      entityNames: 'Entidades',
      entityId: 'ID de entidad',
      action: 'Acción',
      values: 'Valores',
      timestamp: 'Fecha',
      createdByEmail: 'Email del usuario',
    },
  },
  settings: {
    title: 'Configuraciones',
    menu: 'Configuraciones',
    save: {
      success:
        'Configuración guardada con éxito. La página se volverá a cargar en {0} segundos para que los cambios surtan efecto.',
    },
    fields: {
      theme: 'Tema',
      primaryColor: 'Color primario',
      secondaryColor: 'Color secundario',
      logos: 'Logo',
      backgroundImages: 'Imagen de fondo',
    },
    colors: {
      default: 'Defecto',
      cyan: 'Cian',
      'geek-blue': 'Geek Blue',
      gold: 'Oro',
      lime: 'Lima',
      magenta: 'Magenta',
      orange: 'Naranja',
      'polar-green': 'Verde Polar',
      purple: 'Púrpura',
      red: 'Rojo',
      volcano: 'Volcán',
      yellow: 'Amarillo',
    },
  },
  dashboard: {
    menu: 'Tablero',
    message:
      'Esta página utiliza datos falsos solo con fines de demostración. Puede editarlo en '
      + 'frontend/src/modules/dashboard/components/dashboard-page.vue.',
    charts: {
      day: 'Día',
      red: 'Rojo',
      green: 'Verde',
      yellow: 'Amarillo',
      grey: 'Gris',
      blue: 'Azul',
      orange: 'Naranja',
      months: {
        1: 'Enero',
        2: 'Febrero',
        3: 'Marzo',
        4: 'Abril',
        5: 'Mayo',
        6: 'Junio',
        7: 'Julio',
      },
      eating: 'Comiendo',
      drinking: 'Bebiendo',
      sleeping: 'Dormiendo',
      designing: 'Diseñando',
      coding: 'Codificando',
      cycling: 'Pedalando',
      running: 'Corriendo',
      customer: 'Cliente',
    },
  },
  errors: {
    403: 'Lo sentimos, no tienes acceso a esta página',
    404: 'Lo sentimos, la página que visitaste no existe',
    500: 'Lo sentimos, el servidor informa un error',
    429: 'Demasiadas solicitudes. Por favor, inténtelo de nuevo más tarde.',
    backToHome: 'Volver a Inicio',
    forbidden: {
      message: 'Prohibido',
    },
    validation: {
      message: 'Ocurrió un error',
    },
    defaultErrorMessage: 'Ops, ocurrió un error',
  },

  preview: {
    error:
      'Lo sentimos, esta operación no está permitida en el modo de vista previa.',
  },

  /* eslint-disable */
  validation: {
    mixed: {
      default: '{path} no es válido',
      required: '{path} es obligatorio',
      oneOf:
        '{path} debe ser uno de los siguientes valores: ${values}',
      notOneOf:
        '{path} no debe ser uno de los siguientes valores: ${values}',
      notType: ({ path, type, value, originalValue }) => {
        return `${path} debe ser un ${type}`;
      },
    },
    string: {
      length:
        '{path} debe tener exactamente ${length} caracteres',
      min: '{path} debe tener al menos ${min} caracteres',
      max:
        '{path} debe tener como máximo ${max} caracteres',
      matches:
        '{path} debe coincidir con lo siguiente: "${regex}"',
      email:
        '{path} debe ser un correo electrónico válido',
      url: '{path} debe ser una URL válida',
      trim: '{path} debe ser una cadena recortada',
      lowercase:
        '{path} debe ser una cadena en minúsculas',
      uppercase: '{path} debe ser una cadena en mayúscula',
      selected: '{path} debe estar seleccionado',
    },
    number: {
      min: '{path} debe ser mayor o igual que ${min}',
      max: '{path} debe ser menor o igual que ${max}',
      lessThan: '{path} debe ser menor que ${less}',
      moreThan: '{path} debe ser mayor que ${more}',
      notEqual: '{path} no debe ser igual a ${notEqual}',
      positive: '{path} debe ser un número positivo',
      negative: '{path} debe ser un número negativo',
      integer: '{path} debe ser un número entero',
      invalid: '{path} debe ser un número',
    },
    date: {
      min: 'El campo {path} debe ser posterior a {min}',
      max: 'El campo {path} debe ser anterior a {max}',
    },
    boolean: {},
    object: {
      noUnknown:
        'El campo ${path} no puede tener claves no especificadas en la forma del objeto',
    },
    array: {
      min:
        'El campo {path} debe tener al menos {min} elementos',
      max:
        'El campo {path} debe tener elementos menores o iguales a ${max}',
    },
  },

  /* eslint-disable */
  fileUploader: {
    upload: 'Subir',
    image: 'Debes subir una imagen',
    size:
      'El archivo es muy grande. El tamaño máximo permitido es {0}',
    formats: 'Formato inválido. Debe ser uno de: {0}.',
  },

  autocomplete: {
    loading: 'Cargando...',
  },
  imagesViewer: {
    noImage: 'Sin imágen',
  },
};

export default es;
