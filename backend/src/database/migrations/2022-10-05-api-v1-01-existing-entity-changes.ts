import { QueryInterface } from 'sequelize/types'

export const up = async (queryInterface: QueryInterface, Sequelize) => {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    // rename tables
    await queryInterface.renameTable('communityMembers', 'members', {
      transaction,
    })
    await queryInterface.renameTable('communityMemberTags', 'memberTags', {
      transaction,
    })
    await queryInterface.renameTable('communityMemberToMerge', 'memberToMerge', {
      transaction,
    })
    await queryInterface.renameTable('communityMemberNoMerge', 'memberNoMerge', {
      transaction,
    })

    // rename activities.communityMemberId and foreign key constaint name
    await queryInterface.removeConstraint('activities', 'activities_communityMemberId_fkey', {
      transaction,
    })
    await queryInterface.renameColumn('activities', 'communityMemberId', 'memberId', {
      transaction,
    })
    await queryInterface.addConstraint('activities', {
      type: 'foreign key',
      fields: ['memberId'],
      name: 'activities_memberId_fkey',
      references: {
        table: 'members',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // rename memberToMerge.communityMemberId field to memberToMerge.memberId and update fk name
    await queryInterface.removeConstraint(
      'memberToMerge',
      'communityMemberToMerge_communityMemberId_fkey',
      {
        transaction,
      },
    )
    await queryInterface.renameColumn('memberToMerge', 'communityMemberId', 'memberId', {
      transaction,
    })
    await queryInterface.addConstraint('memberToMerge', {
      type: 'foreign key',
      fields: ['memberId'],
      name: 'memberToMerge_memberId_fkey',
      references: {
        table: 'members',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // update fkname of toMergeId
    await queryInterface.removeConstraint(
      'memberToMerge',
      'communityMemberToMerge_toMergeId_fkey',
      {
        transaction,
      },
    )
    await queryInterface.addConstraint('memberToMerge', {
      type: 'foreign key',
      fields: ['toMergeId'],
      name: 'memberToMerge_toMergeId_fkey',
      references: {
        table: 'members',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // rename memberNoMerge.communityMemberId field to memberNoMerge.memberId and update fk name
    await queryInterface.removeConstraint(
      'memberNoMerge',
      'communityMemberNoMerge_communityMemberId_fkey',
      {
        transaction,
      },
    )

    await queryInterface.renameColumn('memberNoMerge', 'communityMemberId', 'memberId', {
      transaction,
    })

    await queryInterface.addConstraint('memberNoMerge', {
      type: 'foreign key',
      fields: ['memberId'],
      name: 'memberNoMerge_memberId_fkey',
      references: {
        table: 'members',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // update fkname of noMergeId
    await queryInterface.removeConstraint(
      'memberNoMerge',
      'communityMemberNoMerge_noMergeId_fkey',
      {
        transaction,
      },
    )
    await queryInterface.addConstraint('memberNoMerge', {
      type: 'foreign key',
      fields: ['noMergeId'],
      name: 'memberNoMerge_noMergeId_fkey',
      references: {
        table: 'members',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // update memberTags.communityMemberId field to memberTags.memberId and update fk name as well
    await queryInterface.removeConstraint(
      'memberTags',
      'communityMemberTags_communityMemberId_fkey',
      {
        transaction,
      },
    )

    await queryInterface.renameColumn('memberTags', 'communityMemberId', 'memberId', {
      transaction,
    })

    await queryInterface.addConstraint('memberTags', {
      type: 'foreign key',
      fields: ['memberId'],
      name: 'memberTags_memberId_fkey',
      references: {
        table: 'members',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // update fkname of tagId
    await queryInterface.removeConstraint('memberTags', 'communityMemberTags_tagId_fkey', {
      transaction,
    })
    await queryInterface.addConstraint('memberTags', {
      type: 'foreign key',
      fields: ['tagId'],
      name: 'memberTags_tagId_fkey',
      references: {
        table: 'tags',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // update members fk names
    // createdById
    await queryInterface.removeConstraint('members', 'communityMembers_createdById_fkey', {
      transaction,
    })
    await queryInterface.addConstraint('members', {
      type: 'foreign key',
      fields: ['createdById'],
      name: 'members_createdById_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // update members fk names
    // tenantId
    await queryInterface.removeConstraint('members', 'communityMembers_tenantId_fkey', {
      transaction,
    })
    await queryInterface.addConstraint('members', {
      type: 'foreign key',
      fields: ['tenantId'],
      name: 'members_tenantId_fkey',
      references: {
        table: 'tenants',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // update members fk names
    // updatedById
    await queryInterface.removeConstraint('members', 'communityMembers_updatedById_fkey', {
      transaction,
    })
    await queryInterface.addConstraint('members', {
      type: 'foreign key',
      fields: ['updatedById'],
      name: 'members_updatedById_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'SET NULL',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // rename indexes that contain "communityMember"
    // activities_community_member_id_tenant_id
    await queryInterface.removeIndex('activities', 'activities_community_member_id_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('activities', ['memberId', 'tenantId'], { transaction })

    // community_members_import_hash_tenant_id
    await queryInterface.removeIndex('members', 'community_members_import_hash_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('members', ['importHash', 'tenantId'], {
      unique: true,
      transaction,
    })

    // community_members_email_tenant_id
    await queryInterface.removeIndex('members', 'community_members_email_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('members', ['email', 'tenantId'], { transaction })

    // community_members_username
    await queryInterface.removeIndex('members', 'community_members_username', { transaction })
    await queryInterface.addIndex('members', ['username'], { transaction })

    // community_members_organisation_tenant_id
    await queryInterface.removeIndex('members', 'community_members_organisation_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('members', ['organisation', 'tenantId'], { transaction })

    // community_members_location_tenant_id
    await queryInterface.removeIndex('members', 'community_members_location_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('members', ['location', 'tenantId'], { transaction })

    // community_members_type_tenant_id
    await queryInterface.removeIndex('members', 'community_members_type_tenant_id', { transaction })
    await queryInterface.addIndex('members', ['type', 'tenantId'], { transaction })

    // community_members_score_tenant_id
    await queryInterface.removeIndex('members', 'community_members_score_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('members', ['score', 'tenantId'], { transaction })

    // community_members_joined_at_tenant_id
    await queryInterface.removeIndex('members', 'community_members_joined_at_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('members', ['joinedAt', 'tenantId'], { transaction })

    // community_members_created_at_tenant_id
    await queryInterface.removeIndex('members', 'community_members_created_at_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('members', ['createdAt', 'tenantId'], { transaction })

    // community_members_signals_tenant_id
    await queryInterface.removeIndex('members', 'community_members_signals_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('members', ['signals', 'tenantId'], { transaction })

    // create new members fields
    // attributes
    await queryInterface.addColumn('members', 'attributes', Sequelize.JSONB, { transaction })

    // displayName
    await queryInterface.addColumn('members', 'displayName', Sequelize.TEXT, { transaction }) 

    // create new activities fields
    await queryInterface.addColumn('activities', 'attributes', Sequelize.JSONB, { transaction })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}

export const down = async (queryInterface: QueryInterface) => {
  const transaction = await queryInterface.sequelize.transaction()

  try {
    await queryInterface.renameTable('members', 'communityMembers', {
      transaction,
    })
    await queryInterface.renameTable('memberTags', 'communityMemberTags', {
      transaction,
    })
    await queryInterface.renameTable('memberToMerge', 'communityMemberToMerge', {
      transaction,
    })
    await queryInterface.renameTable('memberNoMerge', 'communityMemberNoMerge', {
      transaction,
    })

    await queryInterface.removeConstraint('activities', 'activities_memberId_fkey', {
      transaction,
    })
    await queryInterface.renameColumn('activities', 'memberId', 'communityMemberId', {
      transaction,
    })
    await queryInterface.addConstraint('activities', {
      type: 'foreign key',
      fields: ['communityMemberId'],
      name: 'activities_communityMemberId_fkey',
      references: {
        table: 'communityMembers',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    await queryInterface.removeConstraint('communityMemberToMerge', 'memberToMerge_memberId_fkey', {
      transaction,
    })
    await queryInterface.renameColumn('communityMemberToMerge', 'memberId', 'communityMemberId', {
      transaction,
    })
    await queryInterface.addConstraint('communityMemberToMerge', {
      type: 'foreign key',
      fields: ['communityMemberId'],
      name: 'communityMemberToMerge_communityMemberId_fkey',
      references: {
        table: 'communityMembers',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    await queryInterface.removeConstraint(
      'communityMemberToMerge',
      'memberToMerge_toMergeId_fkey',
      {
        transaction,
      },
    )
    await queryInterface.addConstraint('communityMemberToMerge', {
      type: 'foreign key',
      fields: ['toMergeId'],
      name: 'communityMemberToMerge_toMergeId_fkey',
      references: {
        table: 'communityMembers',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    await queryInterface.removeConstraint('communityMemberNoMerge', 'memberNoMerge_memberId_fkey', {
      transaction,
    })
    await queryInterface.renameColumn('communityMemberNoMerge', 'memberId', 'communityMemberId', {
      transaction,
    })
    await queryInterface.addConstraint('communityMemberNoMerge', {
      type: 'foreign key',
      fields: ['communityMemberId'],
      name: 'communityMemberNoMerge_communityMemberId_fkey',
      references: {
        table: 'communityMembers',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    await queryInterface.removeConstraint(
      'communityMemberNoMerge',
      'memberNoMerge_noMergeId_fkey',
      {
        transaction,
      },
    )
    await queryInterface.addConstraint('communityMemberNoMerge', {
      type: 'foreign key',
      fields: ['noMergeId'],
      name: 'communityMemberNoMerge_noMergeId_fkey',
      references: {
        table: 'communityMembers',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // tags
    await queryInterface.removeConstraint('communityMemberTags', 'memberTags_memberId_fkey', {
      transaction,
    })
    await queryInterface.renameColumn('communityMemberTags', 'memberId', 'communityMemberId', {
      transaction,
    })
    await queryInterface.addConstraint('communityMemberTags', {
      type: 'foreign key',
      fields: ['communityMemberId'],
      name: 'communityMemberTags_communityMemberId_fkey',
      references: {
        table: 'communityMembers',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    await queryInterface.removeConstraint('communityMemberTags', 'memberTags_tagId_fkey', {
      transaction,
    })
    await queryInterface.addConstraint('communityMemberTags', {
      type: 'foreign key',
      fields: ['tagId'],
      name: 'communityMemberTags_tagId_fkey',
      references: {
        table: 'tags',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    // members fk revert
    await queryInterface.removeConstraint('communityMembers', 'members_createdById_fkey', {
      transaction,
    })
    await queryInterface.addConstraint('communityMembers', {
      type: 'foreign key',
      fields: ['createdById'],
      name: 'communityMembers_createdById_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    await queryInterface.removeConstraint('communityMembers', 'members_updatedById_fkey', {
      transaction,
    })
    await queryInterface.addConstraint('communityMembers', {
      type: 'foreign key',
      fields: ['updatedById'],
      name: 'communityMembers_updatedById_fkey',
      references: {
        table: 'users',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    await queryInterface.removeConstraint('communityMembers', 'members_tenantId_fkey', {
      transaction,
    })
    await queryInterface.addConstraint('communityMembers', {
      type: 'foreign key',
      fields: ['tenantId'],
      name: 'communityMembers_tenantId_fkey',
      references: {
        table: 'tenants',
        field: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'NO ACTION',
      transaction,
    })

    await queryInterface.removeIndex('activities', 'activities_member_id_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('activities', ['communityMemberId', 'tenantId'], { transaction })

    // community_members_import_hash_tenant_id
    await queryInterface.removeIndex('communityMembers', 'members_import_hash_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('communityMembers', ['importHash', 'tenantId'], {
      unique: true,
      transaction,
    })

    // community_members_email_tenant_id
    await queryInterface.removeIndex('communityMembers', 'members_email_tenant_id', { transaction })
    await queryInterface.addIndex('communityMembers', ['email', 'tenantId'], { transaction })

    // community_members_username
    await queryInterface.removeIndex('communityMembers', 'members_username', { transaction })
    await queryInterface.addIndex('communityMembers', ['username'], { transaction })

    // community_members_organisation_tenant_id
    await queryInterface.removeIndex('communityMembers', 'members_organisation_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('communityMembers', ['organisation', 'tenantId'], { transaction })

    // community_members_location_tenant_id
    await queryInterface.removeIndex('communityMembers', 'members_location_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('communityMembers', ['location', 'tenantId'], { transaction })

    // community_members_type_tenant_id
    await queryInterface.removeIndex('communityMembers', 'members_type_tenant_id', { transaction })
    await queryInterface.addIndex('communityMembers', ['type', 'tenantId'], { transaction })

    // community_members_score_tenant_id
    await queryInterface.removeIndex('communityMembers', 'members_score_tenant_id', { transaction })
    await queryInterface.addIndex('communityMembers', ['score', 'tenantId'], { transaction })

    // community_members_joined_at_tenant_id
    await queryInterface.removeIndex('communityMembers', 'members_joined_at_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('communityMembers', ['joinedAt', 'tenantId'], { transaction })

    // community_members_created_at_tenant_id
    await queryInterface.removeIndex('communityMembers', 'members_created_at_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('communityMembers', ['createdAt', 'tenantId'], { transaction })

    // community_members_signals_tenant_id
    await queryInterface.removeIndex('communityMembers', 'members_signals_tenant_id', {
      transaction,
    })
    await queryInterface.addIndex('communityMembers', ['signals', 'tenantId'], { transaction })

    // remove new members fields
    // attributes
    await queryInterface.removeColumn('communityMembers', 'attributes', { transaction })

    // displayName
    await queryInterface.removeColumn('communityMembers', 'displayName', { transaction }) 

    // remove new activities fields
    await queryInterface.removeColumn('activities', 'attributes', { transaction })

    await transaction.commit()
  } catch (error) {
    await transaction.rollback()
    throw error
  }
}
