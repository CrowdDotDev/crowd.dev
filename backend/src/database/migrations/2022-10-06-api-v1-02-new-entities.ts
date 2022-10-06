export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    // memberAttributeSettings
    await queryInterface.sequelize.query(
      `CREATE TYPE public."enum_memberAttributeSettings_type" AS ENUM (
        'boolean',
        'number',
        'email',
        'string',
        'url',
        'date');
    `,
      { transaction },
    )

    await queryInterface.sequelize.query(
      `CREATE TABLE public."memberAttributeSettings" (
        id uuid NOT NULL,
        "type" public."enum_memberAttributeSettings_type" NOT NULL,
        "canDelete" bool NOT NULL DEFAULT true,
        "show" bool NOT NULL DEFAULT true,
        "label" text NOT NULL,
        "name" text NOT NULL,
        "createdAt" timestamptz NOT NULL,
        "updatedAt" timestamptz NOT NULL,
        "tenantId" uuid NOT NULL,
        "createdById" uuid NULL,
        "updatedById" uuid NULL,
        CONSTRAINT "memberAttributeSettings_pkey" PRIMARY KEY (id),
        CONSTRAINT "memberAttributeSettings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "memberAttributeSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE,
        CONSTRAINT "memberAttributeSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE
    )`,
      { transaction },
    )

    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX member_attribute_settings_name_tenant_id ON public."memberAttributeSettings" USING btree (name, "tenantId");',
      { transaction },
    )

    // tasks
    await queryInterface.sequelize.query(
      `CREATE TABLE public.tasks (
        id uuid NOT NULL,
        "name" text NOT NULL,
        body text NULL,
        status varchar(255) NULL DEFAULT NULL::character varying,
        "dueDate" timestamptz NULL,
        "importHash" varchar(255) NULL,
        "createdAt" timestamptz NOT NULL,
        "updatedAt" timestamptz NOT NULL,
        "deletedAt" timestamptz NULL,
        "tenantId" uuid NOT NULL,
        "assignedToId" uuid NULL,
        "createdById" uuid NULL,
        "updatedById" uuid NULL,
        CONSTRAINT tasks_pkey PRIMARY KEY (id),
        CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE,
        CONSTRAINT "tasks_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE
    )`,
      { transaction },
    )

    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX tasks_import_hash_tenant_id ON public.tasks USING btree ("importHash", "tenantId") WHERE ("deletedAt" IS NULL)',
      { transaction },
    )

    await queryInterface.sequelize.query(
      'CREATE INDEX tasks_name_tenant_id ON public.tasks USING btree (name, "tenantId") WHERE ("deletedAt" IS NULL)',
      { transaction },
    )

    // memberTasks
    await queryInterface.sequelize.query(
      `CREATE TABLE public."memberTasks" (
            "createdAt" timestamptz NOT NULL,
            "updatedAt" timestamptz NOT NULL,
            "memberId" uuid NOT NULL,
            "taskId" uuid NOT NULL,
            CONSTRAINT "memberTasks_pkey" PRIMARY KEY ("memberId", "taskId"),
            CONSTRAINT "memberTasks_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "memberTasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON DELETE CASCADE ON UPDATE CASCADE
        )`,
      { transaction },
    )

    // notes
    await queryInterface.sequelize.query(
      `CREATE TABLE public.notes (
            id uuid NOT NULL,
            body text NOT NULL,
            "importHash" varchar(255) NULL,
            "createdAt" timestamptz NOT NULL,
            "updatedAt" timestamptz NOT NULL,
            "deletedAt" timestamptz NULL,
            "tenantId" uuid NOT NULL,
            "createdById" uuid NULL,
            "updatedById" uuid NULL,
            CONSTRAINT notes_pkey PRIMARY KEY (id),
            CONSTRAINT "notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
            CONSTRAINT "notes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE,
            CONSTRAINT "notes_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE
        )`,
      { transaction },
    )

    // memberNotes
    await queryInterface.sequelize.query(
      `CREATE TABLE public."memberNotes" (
            "createdAt" timestamptz NOT NULL,
            "updatedAt" timestamptz NOT NULL,
            "memberId" uuid NOT NULL,
            "noteId" uuid NOT NULL,
            CONSTRAINT "memberNotes_pkey" PRIMARY KEY ("memberId", "noteId"),
            CONSTRAINT "memberNotes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "memberNotes_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES public.notes(id) ON DELETE CASCADE ON UPDATE CASCADE
        )`,
      { transaction },
    )

    // organizations
    await queryInterface.sequelize.query(
      `CREATE TABLE public.organizations (
            id uuid NOT NULL,
            "name" text NOT NULL,
            url text NULL,
            description text NULL,
            "parentUrl" text NULL,
            emails _text NULL,
            "phoneNumbers" _text NULL,
            logo text NULL,
            tags _text NULL,
            twitter jsonb NULL,
            linkedin jsonb NULL,
            crunchbase jsonb NULL,
            employees int4 NULL,
            "revenueRange" jsonb NULL,
            "importHash" varchar(255) NULL,
            "createdAt" timestamptz NOT NULL,
            "updatedAt" timestamptz NOT NULL,
            "deletedAt" timestamptz NULL,
            "tenantId" uuid NOT NULL,
            "createdById" uuid NULL,
            "updatedById" uuid NULL,
            CONSTRAINT organizations_pkey PRIMARY KEY (id),
            CONSTRAINT "organizations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE,
            CONSTRAINT "organizations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE,
            CONSTRAINT "organizations_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON DELETE SET NULL ON UPDATE CASCADE
        )`,
      { transaction },
    )

    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX organizations_import_hash_tenant_id ON public.organizations USING btree ("importHash", "tenantId") WHERE ("deletedAt" IS NULL)`,
      { transaction },
    )

    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX organizations_name_tenant_id ON public.organizations USING btree (name, "tenantId") WHERE ("deletedAt" IS NULL)`,
      { transaction },
    )

    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX organizations_url_tenant_id ON public.organizations USING btree (url, "tenantId") WHERE (("deletedAt" IS NULL) AND (url IS NOT NULL))`,
      { transaction },
    )

    // memberOrganizations
    await queryInterface.sequelize.query(
      `CREATE TABLE public."memberOrganizations" (
            "createdAt" timestamptz NOT NULL,
            "updatedAt" timestamptz NOT NULL,
            "memberId" uuid NOT NULL,
            "organizationId" uuid NOT NULL,
            CONSTRAINT "memberOrganizations_pkey" PRIMARY KEY ("memberId", "organizationId"),
            CONSTRAINT "memberOrganizations_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON DELETE CASCADE ON UPDATE CASCADE,
            CONSTRAINT "memberOrganizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON DELETE CASCADE ON UPDATE CASCADE
        )`,
      { transaction },
    )

    // organizationCaches
    await queryInterface.sequelize.query(
      `CREATE TABLE public."organizationCaches" (
            id uuid NOT NULL,
            "name" text NOT NULL,
            url text NULL,
            description text NULL,
            "parentUrl" text NULL,
            emails _text NULL,
            "phoneNumbers" _text NULL,
            logo text NULL,
            tags _text NULL,
            twitter jsonb NULL,
            linkedin jsonb NULL,
            crunchbase jsonb NULL,
            employees int4 NULL,
            "revenueRange" jsonb NULL,
            "importHash" varchar(255) NULL,
            "createdAt" timestamptz NOT NULL,
            "updatedAt" timestamptz NOT NULL,
            "deletedAt" timestamptz NULL,
            CONSTRAINT "organizationCaches_pkey" PRIMARY KEY (id)
        )`,
      { transaction },
    )

    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX organization_caches_url ON public."organizationCaches" USING btree (url) WHERE (("deletedAt" IS NULL) AND (url IS NOT NULL))`,
      { transaction },
    )
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.sequelize.query('DROP TABLE "memberAttributeSettings"', {
      transaction,
    })

    await queryInterface.sequelize.query('DROP TYPE public."enum_memberAttributeSettings_type"', {
      transaction,
    })

    await queryInterface.sequelize.query('DROP TABLE "memberTasks"', {
      transaction,
    })

    await queryInterface.sequelize.query('DROP TABLE "tasks"', {
      transaction,
    })

    await queryInterface.sequelize.query('DROP TABLE "memberNotes"', {
      transaction,
    })

    await queryInterface.sequelize.query('DROP TABLE "notes"', {
      transaction,
    })

    await queryInterface.sequelize.query('DROP TABLE "memberOrganizations"', {
      transaction,
    })

    await queryInterface.sequelize.query('DROP TABLE "organizations"', {
      transaction,
    })

    await queryInterface.sequelize.query('DROP TABLE "organizationCaches"', {
      transaction,
    })
    
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
