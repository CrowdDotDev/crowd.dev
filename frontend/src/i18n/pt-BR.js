const ptBR = {
  common: {
    or: 'ou',
    cancel: 'Cancelar',
    reset: 'Limpar',
    save: 'Salvar',
    search: 'Buscar',
    edit: 'Editar',
    remove: 'Remover',
    new: 'Novo',
    export: 'Exportar para Excel',
    noDataToExport: 'Não há dados para exportar',
    import: 'Importar',
    discard: 'Descartar',
    yes: 'Sim',
    no: 'Não',
    pause: 'Pausar',
    areYouSure: 'Tem certeza?',
    view: 'Visualizar',
    destroy: 'Deletar',
    mustSelectARow: 'Selecine uma linha',
    confirm: 'Confirmar',
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
      name: 'Project',
      label: 'Projects',
      menu: 'Projects',
      exporterFileName: 'Project_exportados',
      list: {
        menu: 'Projects',
        title: 'Projects',
      },
      create: {
        success: 'Project salvo com sucesso',
      },
      update: {
        success: 'Project salvo com sucesso',
      },
      destroy: {
        success: 'Project deletado com sucesso',
      },
      destroyAll: {
        success: 'Project(s) deletado com sucesso',
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
        createdAt: 'Criado em',
        updatedAt: 'Atualizado em',
        createdAtRange: 'Criado em',
      },
      enumerators: {},
      placeholders: {},
      hints: {},
      new: {
        title: 'Novo Project',
      },
      view: {
        title: 'Visualizar Project',
      },
    },

    repo: {
      name: 'Repo',
      label: 'Repos',
      menu: 'Repos',
      exporterFileName: 'Repo_exportados',
      list: {
        menu: 'Repos',
        title: 'Repos',
      },
      create: {
        success: 'Repo salvo com sucesso',
      },
      update: {
        success: 'Repo salvo com sucesso',
      },
      destroy: {
        success: 'Repo deletado com sucesso',
      },
      destroyAll: {
        success: 'Repo(s) deletado com sucesso',
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
        createdAt: 'Criado em',
        updatedAt: 'Atualizado em',
        createdAtRange: 'Criado em',
      },
      enumerators: {},
      placeholders: {},
      hints: {},
      new: {
        title: 'Novo Repo',
      },
      view: {
        title: 'Visualizar Repo',
      },
    },

    communityMember: {
      name: 'Member',
      label: 'Members',
      menu: 'Members',
      exporterFileName: 'Member_exportados',
      list: {
        menu: 'Members',
        title: 'Members',
      },
      create: {
        success: 'Member salvo com sucesso',
      },
      update: {
        success: 'Member salvo com sucesso',
      },
      destroy: {
        success: 'Member deletado com sucesso',
      },
      destroyAll: {
        success: 'Member(s) deletado com sucesso',
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
        title: 'Novo Member',
      },
      view: {
        title: 'Visualizar Member',
      },
    },

    activity: {
      name: 'Activity',
      label: 'Activities',
      menu: 'Activities',
      exporterFileName: 'Activity_exportados',
      list: {
        menu: 'Activities',
        title: 'Activities',
      },
      create: {
        success: 'Activity salvo com sucesso',
      },
      update: {
        success: 'Activity salvo com sucesso',
      },
      destroy: {
        success: 'Activity deletado com sucesso',
      },
      destroyAll: {
        success: 'Activity(s) deletado com sucesso',
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
        createdAt: 'Criado em',
        updatedAt: 'Atualizado em',
        createdAtRange: 'Criado em',
      },
      enumerators: {},
      placeholders: {},
      hints: {},
      new: {
        title: 'Novo Activity',
      },
      view: {
        title: 'Visualizar Activity',
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
    tenants: 'Áreas de Trabalho',
    profile: {
      title: 'Perfil',
      success: 'Perfil atualizado com sucesso',
    },
    createAnAccount: 'Criar uma conta',
    rememberMe: 'Lembrar-me',
    forgotPassword: 'Esqueci minha senha',
    signin: 'Entrar',
    signup: 'Registrar',
    signout: 'Sair',
    alreadyHaveAnAccount: 'Já possui uma conta? Entre.',
    social: {
      errors: {
        'auth-invalid-provider':
          'Este email está registrado para outro provedor.',
        'auth-no-email': 'O email associado a esta conta é privado ou não existe.',
      },
    },
    signinWithAnotherAccount: 'Entrar com outra conta',
    emailUnverified: {
      message: 'Por favor, confirme seu email em <strong>{0}</strong> para continuar.',
      submit: 'Reenviar confirmação por email',
    },
    passwordResetEmail: {
      message: 'Enviar email de redefinição de senha',
      error: 'Email não encontrado',
    },
    emptyPermissions: {
      message: 'Você ainda não possui permissões. Aguarde o administrador conceder seus privilégios.',
    },
    passwordReset: {
      message: 'Alterar senha',
    },
    passwordChange: {
      title: 'Mudar a Senha',
      success: 'Senha alterada com sucesso',
      mustMatch: 'Senhas devem ser iguais',
    },
    emailAddressVerificationEmail: {
      error: 'Email não encontrado',
    },
    verificationEmailSuccess: 'Verificação de email enviada com sucesso',
    passwordResetEmailSuccess: 'Email de redefinição de senha enviado com sucesso',
    passwordResetSuccess: 'Senha alterada com sucesso',
    verifyEmail: {
      success: 'Email verificado com sucesso.',
      message:
        'Aguarde um momento, seu email está sendo verificado...',
    },
  },

  roles: {
    admin: {
      label: 'Administrador',
      description: 'Acesso completo a todos os recursos',
    },
    custom: {
      label: 'Perfil Customizado',
      description: 'Acesso customizado',
    },
  },

  user: {
    fields: {
      id: 'Id',
      avatars: 'Avatar',
      email: 'Email',
      emails: 'Email(s)',
      fullName: 'Nome',
      firstName: 'Nome',
      lastName: 'Sobrenome',
      status: 'Estado',
      phoneNumber: 'Telefone',
      role: 'Perfil',
      createdAt: 'Criado em',
      updatedAt: 'Atualizado em',
      roleUser: 'Perfil/Usuário',
      roles: 'Perfis',
      createdAtRange: 'Criado em',
      password: 'Senha',
      oldPassword: 'Senha Antiga',
      newPassword: 'Nova Senha',
      newPasswordConfirmation: 'Confirmação da Nova Senha',
      rememberMe: 'Lembrar-me',
    },
    status: {
      active: 'Ativo',
      invited: 'Convidado',
      'empty-permissions': 'Aguardando Permissões',
    },
    invite: 'Convidar',
    validations: {
      email: 'Email {value} é inválido',
    },
    title: 'Usuários',
    menu: 'Usuários',
    doAddSuccess: 'Usuário(s) salvos com sucesso',
    doUpdateSuccess: 'Usuário salvo com sucesso',
    exporterFileName: 'usuarios_exportados',
    doDestroySuccess: 'Usuário deletado com sucesso',
    doDestroyAllSelectedSuccess:
      'Usuários deletado com sucesso',
    edit: {
      title: 'Editar usuário',
    },
    new: {
      title: 'Novo(s) Usuário(s)',
      titleModal: 'Novo Usuário',
      emailsHint:
        'Separe múltiplos endereços de e-mail usando a vírgula.',
    },
    view: {
      title: 'Visualizar Usuário',
      activity: 'Atividades',
    },
    errors: {
      userAlreadyExists: 'Usuário com este email já existe',
      userNotFound: 'Usuário não encontrado',
      revokingOwnPermission: 'Você não pode revogar sua própria permissão de proprietário',
    },
  },

  tenant: {
    name: 'tenant',
    label: 'Área de Trabalho',
    menu: 'Áreas de Trabalho',
    list: {
      menu: 'Áreas de Trabalho',
      title: 'Áreas de Trabalho',
    },
    create: {
      button: 'Criar Área de Trabalho',
      success: 'Área de Trabalho salva com sucesso',
    },
    update: {
      success: 'Área de Trabalho salva com sucesso',
    },
    destroy: {
      success: 'Área de Trabalho deletada com sucesso',
    },
    destroyAll: {
      success: 'Área(s) de Trabalho deletadas com sucesso',
    },
    edit: {
      title: 'Editar Área de Trabalho',
    },
    fields: {
      id: 'Id',
      name: 'Nome',
      tenantName: 'Nome da Área de Trabalho',
      tenantId: 'Área de Trabalho',
      tenantUrl: 'URL da Área de Trabalho',
      plan: 'Plano',
    },
    enumerators: {},
    new: {
      title: 'Nova Área de Trabalho',
    },
    invitation: {
      view: 'Ver Convites',
      invited: 'Convidado',
      accept: 'Aceitar Convite',
      decline: 'Recusar Convite',
      declined: 'Convite recusado com sucesso',
      acceptWrongEmail: 'Aceitar Convite Com Este Email',
    },
    select: 'Selecionar Área de Trabalho',
    url: {
      exists: 'Esta URL de área de trabalho já está em uso.',
    },
  },

  plan: {
    menu: 'Planos',
    title: 'Planos',

    free: {
      label: 'Gratuito',
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

    pricingPeriod: '/mês',
    current: 'Plano Atual',
    subscribe: 'Assinar',
    manage: 'Gerenciar Assinatura',
    somethingWrong:
      'Há algo errado com sua assinatura. Por favor clique em Gerenciar Assinatura para mais informações.',
    cancelAtPeriodEnd:
      'O plano será cancelado no fim do período.',
    notPlanUser: 'Esta assinatura não é controlada por você.',
  },

  auditLog: {
    menu: 'Registros de Auditoria',
    title: 'Registros de Auditoria',
    exporterFileName: 'registros_autoria_exportados',
    entityNamesHint:
      'Separe múltiplas entidades por vírgula',
    fields: {
      id: 'Id',
      timestampRange: 'Período',
      entityName: 'Entidade',
      entityNames: 'Entidades',
      entityId: 'ID da Entidade',
      action: 'Ação',
      values: 'Valores',
      timestamp: 'Data',
      createdByEmail: 'Email do Usuário',
    },
  },
  settings: {
    title: 'Configurações',
    menu: 'Configurações',
    save: {
      success:
        'Configurações salvas com sucesso. A página irá recarregar em {0} para que as alterações tenham efeito.',
    },
    fields: {
      theme: 'Tema',
      logos: 'Logo',
      backgroundImages: 'Papel de Parede',
    },
    colors: {
      default: 'Padrão',
      cyan: 'Ciano',
      'geek-blue': 'Azul escuro',
      gold: 'Ouro',
      lime: 'Limão',
      magenta: 'Magenta',
      orange: 'Laranja',
      'polar-green': 'Verde polar',
      purple: 'Roxo',
      red: 'Vermelho',
      volcano: 'Vúlcão',
      yellow: 'Amarelo',
    },
  },
  dashboard: {
    menu: 'Dashboard',
    message: 'Esta página usa dados falsos apenas para fins de demonstração. Você pode editá-la em '
      + 'frontend/src/modules/dashboard/components/dashboard-page.vue.',
    charts: {
      day: 'Dia',
      red: 'Vermelho',
      green: 'Verde',
      yellow: 'Amarelho',
      grey: 'Cinza',
      blue: 'Azul',
      orange: 'Laranja',
      months: {
        1: 'Janeiro',
        2: 'Fevereiro',
        3: 'Março',
        4: 'Abril',
        5: 'Maio',
        6: 'Junho',
        7: 'Julho',
      },
      eating: 'Comendo',
      drinking: 'Bebendo',
      sleeping: 'Dormindo',
      designing: 'Projetando',
      coding: 'Codificando',
      cycling: 'Pedalando',
      running: 'Correndo',
      customer: 'Cliente',
    },
  },
  errors: {
    backToHome: 'Voltar a página inicial',
    403: 'Desculpe, você não tem acesso a esta página',
    404: 'Desculpe, a página que você visitou não existe',
    500: 'Desculpe, o servidor está relatando um erro',
    429: 'Muitas requisições. Por favor, tente novamente mais tarde.',
    forbidden: {
      message: 'Acesso negado',
    },
    validation: {
      message: 'Ocorreu um erro',
    },
    defaultErrorMessage: 'Ops, ocorreu um erro',
  },

  preview: {
    error:
      'Desculpe, esta operação não é permitida em modo de demonstração.',
  },

  // See https://github.com/jquense/yup#using-a-custom-locale-dictionary
  /* eslint-disable */
  validation: {
    mixed: {
      default: '{path} é inválido',
      required: '{path} é obrigatório',
      oneOf:
        '{path} deve ser um dos seguintes valores: {values}',
      notOneOf:
        '{path} não deve ser um dos seguintes valores: {values}',
      notType: ({ path, type, value, originalValue }) => {
        return `${path} deve ser um ${type}`;
      },
    },
    string: {
      length: '{path} deve possuir {length} caracteres',
      min:
        '{path} deve possuir ao menos {min} caracteres',
      max:
        '{path} deve possui no máximo {max} caracteres',
      matches:
        '{path} deve respeitar o padrão: "{regex}"',
      email: '{path} deve ser um email válido',
      url: '{path} deve ser uma URL válida',
      trim:
        '{path} deve ser uma palavra sem espaços em branco',
      lowercase: '{path} deve ser minúsculo',
      uppercase: '{path} deve ser maiúsculo',
      selected: '{path} deve ser selecionado',
    },
    number: {
      min: '{path} deve ser maior ou igual a {min}',
      max: '{path} deve ser menor ou igual a {max}',
      lessThan: '{path} deve ser menor que {less}',
      moreThan: '{path} deve ser maior que {more}',
      notEqual: '{path} não deve ser igual a {notEqual}',
      positive: '{path} deve ser um número positivo',
      negative: '{path} deve ser um número negativo',
      integer: '{path} deve ser um inteiro',
      invalid: '{path} deve ser um número',
    },
    date: {
      min: '{path} deve ser posterior a {min}',
      max: '{path} deve ser mais cedo do que {max}',
    },
    boolean: {},
    object: {
      noUnknown:
        '{path} não pode ter atributos não especificados no formato do objeto',
    },
    array: {
      min: '{path} deve possuir ao menos {min} itens',
      max: '{path} deve possuir no máximo {max} itens',
    },
  },
  /* eslint-disable */
  fileUploader: {
    upload: 'Upload',
    image: 'Você deve fazer upload de uma imagem',
    size:
      'O arquivo é muito grande. O tamanho máximo permitido é {0}',
    formats: `Formato inválido. Deve ser um destes: {0}.`,
  },

  autocomplete: {
    loading: 'Carregando...',
  },

  imagesViewer: {
    noImage: 'Sem imagem',
  },
};

export default ptBR;
