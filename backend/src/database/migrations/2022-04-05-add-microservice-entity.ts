export const up = async (queryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()
  try {
    await queryInterface.sequelize.query(
      `CREATE TABLE IF NOT EXISTS "microservices" 
        ("id" UUID , "init" BOOLEAN NOT NULL DEFAULT false, 
        "running" BOOLEAN NOT NULL DEFAULT false, 
        "type" TEXT NOT NULL, 
        "variant" TEXT, 
        "settings" JSONB NOT NULL DEFAULT '{}'::jsonb, 
        "importHash" VARCHAR(255), 
        "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, 
        "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, 
        "tenantId" UUID NOT NULL REFERENCES "tenants" ("id") ON DELETE NO ACTION ON UPDATE CASCADE, 
        "createdById" UUID REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE, 
        "updatedById" UUID REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE, 
        PRIMARY KEY ("id"));`,
    )

    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX "microservices_import_hash_tenant_id" ON "microservices" ("importHash", "tenantId")',
    )

    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX "microservices_type_tenant_id" ON "microservices" ("type", "tenantId")',
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
    await queryInterface.sequelize.query('DROP TABLE IF EXISTS "microservices" CASCADE')
    return transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
