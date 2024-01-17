import lodash from 'lodash'

import {
  MemberAttributeType,
  MemberEnrichmentAttributes,
  MemberAttributes,
  MemberAttributeName,
  MemberEnrichmentAttributeName,
  PlatformType,
  IMember,
} from '@crowd/types'
import {
  EnrichmentAPIContribution,
  EnrichmentAPISkills,
  EnrichmentAPIMember,
  EnrichmentAPIWorkExperience,
  EnrichmentAPIEducation,
  EnrichmentAPICertification,
} from '@crowd/types/premium'
import { DbTransaction } from '@crowd/database'
import { generateUUIDv4 } from '@crowd/common'

const attributeSettings = {
  [MemberAttributeName.AVATAR_URL]: {
    fields: ['profile_pic_url'],
    default: true,
  },
  [MemberAttributeName.LOCATION]: {
    fields: ['location'],
    default: true,
  },
  [MemberAttributeName.BIO]: {
    fields: ['title', 'work_experiences[0].title'],
  },
  [MemberEnrichmentAttributeName.SENIORITY_LEVEL]: {
    fields: ['seniority_level'],
    type: MemberAttributeType.STRING,
  },
  [MemberEnrichmentAttributeName.COUNTRY]: {
    fields: ['country'],
    type: MemberAttributeType.STRING,
  },
  [MemberEnrichmentAttributeName.PROGRAMMING_LANGUAGES]: {
    fields: ['programming_languages'],
    type: MemberAttributeType.MULTI_SELECT,
  },
  [MemberEnrichmentAttributeName.LANGUAGES]: {
    fields: ['languages'],
    type: MemberAttributeType.MULTI_SELECT,
  },
  [MemberEnrichmentAttributeName.YEARS_OF_EXPERIENCE]: {
    fields: ['years_of_experience'],
    type: MemberAttributeType.NUMBER,
  },
  [MemberEnrichmentAttributeName.EXPERTISE]: {
    fields: ['expertise'],
    type: MemberAttributeType.MULTI_SELECT,
  },
  [MemberEnrichmentAttributeName.WORK_EXPERIENCES]: {
    fields: ['work_experiences'],
    type: MemberAttributeType.SPECIAL,
    fn: (workExperiences: EnrichmentAPIWorkExperience[]) =>
      workExperiences.map((workExperience) => {
        const { title, company, location, startDate, endDate } = workExperience
        return {
          title,
          company,
          location,
          startDate,
          endDate: endDate || 'Present',
        }
      }),
  },
  [MemberEnrichmentAttributeName.EDUCATION]: {
    fields: ['educations'],
    type: MemberAttributeType.SPECIAL,
    fn: (educations: EnrichmentAPIEducation[]) =>
      educations.map((education) => {
        const { campus, major, specialization, startDate, endDate } = education
        return {
          campus,
          major,
          specialization,
          startDate,
          endDate: endDate || 'Present',
        }
      }),
  },
  [MemberEnrichmentAttributeName.AWARDS]: {
    fields: ['awards'],
    type: MemberAttributeType.SPECIAL,
  },
  [MemberEnrichmentAttributeName.CERTIFICATIONS]: {
    fields: ['certifications'],
    type: MemberAttributeType.SPECIAL,
    fn: (certifications: EnrichmentAPICertification[]) =>
      certifications.map((certification) => {
        const { title, description } = certification
        return {
          title,
          description,
        }
      }),
  },
}

export const normalize = async (
  tx: DbTransaction,
  member: IMember,
  enriched: EnrichmentAPIMember,
): Promise<IMember> => {
  try {
    member = await fillPlatformData(tx, member, enriched)
  } catch (err) {
    throw new Error(err)
  }

  try {
    member = await fillAttributes(tx, member, enriched)
  } catch (err) {
    throw new Error(err)
  }

  try {
    member = await fillSkills(tx, member, enriched)
  } catch (err) {
    throw new Error(err)
  }

  return member
}

/**
 * This function is used to fill in a member's social media handles and profile links based on data obtained from an external API
 * @param member - The object that contains properties such as 'username' and 'attributes'
 * @param enriched - An object that contains data obtained from an external API
 * @returns the updated 'member' object
 */
// eslint-disable-next-line class-methods-use-this
const fillPlatformData = async (
  tx: DbTransaction,
  member: IMember,
  enriched: EnrichmentAPIMember,
): Promise<IMember> => {
  if (enriched.emails && Array.isArray(enriched.emails)) {
    if (enriched.emails.length > 0) {
      const emailSet = new Set<string>(
        enriched.emails.filter((email) => !email.includes('noreply.github')),
      )

      if (!member.emails) {
        member.emails = []
      }
      member.emails.forEach((email) => emailSet.add(email))
      member.emails = Array.from(emailSet)
    }
  }

  member.contributions = enriched.oss_contributions?.map(
    (contribution: EnrichmentAPIContribution) => ({
      id: contribution.id,
      topics: contribution.topics,
      summary: contribution.summary,
      url: contribution.github_url,
      firstCommitDate: contribution.first_commit_date,
      lastCommitDate: contribution.last_commit_date,
      numberCommits: contribution.num_of_commits,
    }),
  )

  if (enriched.github_handle) {
    // Set 'member.username.github' to be equal to 'enriched.github_handle' (if it is not already set)
    member.username[PlatformType.GITHUB] =
      member.username[PlatformType.GITHUB] || enriched.github_handle
    if (!member.attributes.url) {
      // If it does not exist, initialize it as an empty object
      member.attributes.url = {}
    }
    // Set 'member.attributes.url.github' to be equal to a string concatenated with the 'github_handle' property
    member.attributes.url.github =
      member.attributes.url.github || `https://github.com/${enriched.github_handle}`
  }

  if (enriched.linkedin_url) {
    member.username[PlatformType.LINKEDIN] =
      member.username[PlatformType.LINKEDIN] || enriched.linkedin_url.split('/').pop()

    if (!member.attributes.url) {
      member.attributes.url = {}
    }

    member.attributes.url.linkedin = member.attributes.url.linkedin || enriched.linkedin_url
  }

  if (enriched.twitter_handle) {
    member.username[PlatformType.TWITTER] =
      member.username[PlatformType.TWITTER] || enriched.twitter_handle

    if (!member.attributes.url) {
      member.attributes.url = {}
    }
    member.attributes.url.twitter =
      member.attributes.url.twitter || `https://twitter.com/${enriched.twitter_handle}`
  }

  // We are updating the displayName only if the existing one has one word only
  // And we are using an update here instead of the upsert because
  // upsert always takes the existing displayName
  let stmtDisplayName = ''
  if (!/\W/.test(member.displayName)) {
    if (enriched.first_name && enriched.last_name) {
      member.displayName = `${enriched.first_name} ${enriched.last_name}`
      stmtDisplayName = `"displayName" = $1,`
    }
  }

  try {
    await tx.query(
      `UPDATE members SET ${stmtDisplayName}
      emails = $2,
      attributes = $3,
      contributions = $4,
      "lastEnriched" = NOW()
    WHERE id = $5 AND "tenantId" = $6;`,
      [
        member.displayName,
        member.emails,
        member.attributes,
        JSON.stringify(member.contributions),
        member.id,
        member.tenantId,
      ],
    )
  } catch (err) {
    throw new Error(err)
  }

  for (const platform in member.username) {
    try {
      await tx.query(
        `INSERT INTO "memberIdentities" ("memberId", "tenantId", platform, username)
          VALUES ($1, $2, $3, $4)
          ON CONFLICT ON CONSTRAINT "memberIdentities_platform_username_tenantId_key" DO UPDATE
          SET username = EXCLUDED.username, "updatedAt" = NOW();`,
        [member.id, member.tenantId, platform, member.username[platform]],
      )
    } catch (err) {
      throw new Error(err)
    }
  }

  try {
    await tx.query(
      `INSERT INTO "memberEnrichmentCache" ("memberId", "data", "createdAt", "updatedAt")
      VALUES ($1, $2, NOW(), NOW())
      ON CONFLICT ("memberId") DO UPDATE
      SET data = EXCLUDED.data, "updatedAt" = NOW();`,
      [member.id, JSON.stringify(enriched)],
    )
  } catch (err) {
    throw new Error(err)
  }

  return member
}

/**
 * This function is used to fill in a member's attributes based on data obtained from an external API
 * @param member - The object that contains properties such as 'attributes'
 * @param enriched - An object that contains data obtained from an external API
 * @returns the updated 'member' object
 */
const fillAttributes = async (
  tx: DbTransaction,
  member: IMember,
  enriched: EnrichmentAPIMember,
): Promise<IMember> => {
  // Check if 'member.attributes' property exists
  if (!member.attributes) {
    // If it does not exist, initialize it as an empty object
    member.attributes = {}
  }

  // eslint-disable-next-line guard-for-in
  for (const attributeName in attributeSettings) {
    const attribute = attributeSettings[attributeName]

    let value = null

    for (const field of attribute.fields) {
      if (value) {
        break
      }
      // Get value from 'enriched' object using the defined mapping and 'lodash.get'
      value = lodash.get(enriched, field)
    }

    if (value) {
      // Check if 'member.attributes[attributeName]' exists, and if it does not, initialize it as an empty object
      if (!member.attributes[attributeName]) {
        member.attributes[attributeName] = {}
      }

      // Check if 'attribute.fn' exists, otherwise set it the identity function
      const fn = attribute.fn || ((value) => value)
      value = fn(value)

      // Assign 'value' to 'member.attributes[attributeName].enrichment'
      member.attributes[attributeName].enrichment = value

      try {
        member = await createAttributeAndUpdateOptions(tx, member, attributeName, attribute, value)
      } catch (err) {
        throw new Error(err)
      }
    }
  }

  return member
}

/**
 * This function is used to fill in a member's skills based on data obtained from an external API
 * @param member - The object that contains properties such as 'attributes'
 * @param enriched - An object that contains data obtained from an external API
 * @returns the updated 'member' object
 */
const fillSkills = async (
  tx: DbTransaction,
  member: IMember,
  enriched: EnrichmentAPIMember,
): Promise<IMember> => {
  // Check if 'enriched.skills' properties exists
  if (enriched.skills) {
    if (!member.attributes.skills) {
      member.attributes.skills = {}
    }

    // Assign unique and ordered skills to 'member.attributes[MemberEnrichmentAttributeName.SKILLS].enrichment'
    member.attributes[MemberEnrichmentAttributeName.SKILLS].enrichment = lodash.uniq([
      // Use 'lodash.orderBy' to sort the skills by weight in descending order
      ...lodash
        .orderBy(enriched.skills || [], ['weight'], ['desc'])
        .map((s: EnrichmentAPISkills) => s.skill),
    ])

    try {
      member = await createAttributeAndUpdateOptions(
        tx,
        member,
        MemberEnrichmentAttributeName.SKILLS,
        { type: MemberAttributeType.MULTI_SELECT },
        member.attributes.skills.enrichment,
      )
    } catch (err) {
      throw new Error(err)
    }
  }

  return member
}

/**
 * This function is used to create new attribute and update options for member's attributes
 * @param attributeName - The name of the attribute
 * @param attribute - The attribute object
 * @param value - the value of the attribute
 */
const createAttributeAndUpdateOptions = async (
  tx: DbTransaction,
  member: IMember,
  attributeName,
  attribute,
  value,
): Promise<IMember> => {
  // Check if attribute type is 'MULTI_SELECT' and the attribute already exists
  if (
    attribute.type === MemberAttributeType.MULTI_SELECT &&
    lodash.find(member.attributes, { name: attributeName })
  ) {
    // Find attributeSettings by name
    const attributeSettings = lodash.find(member.attributes, { name: attributeName })
    // Get options
    let options = attributeSettings.options || []
    options = lodash.uniq([...options, ...value])

    try {
      await tx.query(
        `UPDATE "memberAttributeSettings"
        SET options = $1
        WHERE id = $2 AND "tenantId" = $3;`,
        [options, attributeSettings.id, member.tenantId],
      )
    } catch (err) {
      throw new Error(err)
    }
  }

  // Check if the attribute does not exist and it is not a default attribute
  if (!(lodash.find(member.attributes, { name: attributeName }) || attribute.default)) {
    // Create new attribute if it does not exist
    try {
      await tx.query(
        `INSERT INTO "memberAttributeSettings" (id, "tenantId", name, label, type, show, "canDelete", options, "createdAt", "updatedAt")
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9)
        ON CONFLICT (name,"tenantId") DO UPDATE
        SET options = EXCLUDED.options, "updatedAt" = $9;`,
        [
          generateUUIDv4(),
          member.tenantId,
          attributeName,
          MemberEnrichmentAttributes[attributeName]?.label || MemberAttributes[attributeName].label,
          attribute?.type ||
            MemberEnrichmentAttributes[attributeName]?.type ||
            MemberAttributes[attributeName].type ||
            MemberAttributeType.STRING,
          attributeName !== MemberEnrichmentAttributeName.EMAILS,
          false,
          attribute.type === MemberAttributeType.MULTI_SELECT ? attribute.options : [],
          new Date(Date.now()),
        ],
      )
    } catch (err) {
      throw new Error(err)
    }
  }

  return member
}
