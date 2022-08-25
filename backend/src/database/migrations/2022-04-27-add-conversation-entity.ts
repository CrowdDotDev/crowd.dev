export const up = async (queryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.sequelize.query(
      `CREATE TABLE "conversations" (
        "id" UUID NOT NULL,
        "title" TEXT NOT NULL,
        "slug" TEXT NOT NULL,
        "published" BOOLEAN NOT NULL DEFAULT 'false',
        "createdAt" TIMESTAMPTZ NOT NULL,
        "updatedAt" TIMESTAMPTZ NOT NULL,
        "tenantId" UUID NOT NULL,
        "createdById" UUID NULL DEFAULT NULL,
        "updatedById" UUID NULL DEFAULT NULL,
        PRIMARY KEY ("id"),
        CONSTRAINT "conversations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE SET NULL,
        CONSTRAINT "conversations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "public"."tenants" ("id") ON UPDATE CASCADE ON DELETE NO ACTION,
        CONSTRAINT "conversations_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "public"."users" ("id") ON UPDATE CASCADE ON DELETE SET NULL
    )`,
    )
    await queryInterface.addColumn('activities', 'conversationId', Sequelize.UUID)
    await queryInterface.addConstraint('activities', {
      type: 'foreign key',
      fields: ['conversationId'],
      name: 'activities_conversationId_fkey',
      references: {
        table: 'conversations',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'CASCADE',
    })

    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX "conversations_slug_tenant_id" ON "conversations" ("slug", "tenantId")',
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
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "conversations" CASCADE')
    await queryInterface.removeColumn('activities', 'conversationId')
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
