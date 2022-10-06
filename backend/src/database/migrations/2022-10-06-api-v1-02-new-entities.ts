export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {

    await queryInterface.sequelize.query(`CREATE TYPE public."enum_memberAttributeSettings_type" AS ENUM (
        'boolean',
        'number',
        'email',
        'string',
        'url',
        'date');
    `, { transaction })

    await queryInterface.sequelize.query(`CREATE TYPE public."_enum_memberAttributeSettings_type" (
        INPUT = array_in,
        OUTPUT = array_out,
        RECEIVE = array_recv,
        SEND = array_send,
        ANALYZE = array_typanalyze,
        ALIGNMENT = 4,
        STORAGE = any,
        CATEGORY = A,
        ELEMENT = public."enum_memberAttributeSettings_type",
        DELIMITER = ',');
    `, { transaction })

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
    { transaction }
    )

    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX member_attribute_settings_name_tenant_id ON public."memberAttributeSettings" USING btree (name, "tenantId");',
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
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "memberAttributeSettings" CASCADE', { transaction })
    await queryInterface.query('DROP TYPE public."_enum_memberAttributeSettings_type"', { transaction })
    await queryInterface.query('DROP TYPE public."enum_memberAttributeSettings_type"', { transaction })
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
