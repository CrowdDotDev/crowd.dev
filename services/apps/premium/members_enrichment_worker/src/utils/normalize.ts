import lodash from 'lodash'

import {
  MemberAttributeType,
  MemberEnrichmentAttributes,
  MemberAttributes,
  MemberAttributeName,
  MemberEnrichmentAttributeName,
  PlatformType,
  IMember,
  MemberIdentityType,
} from '@crowd/types'
import {
  EnrichmentAPIContribution,
  EnrichmentAPISkills,
  EnrichmentAPIMember,
  EnrichmentAPIWorkExperience,
  EnrichmentAPIEducation,
  EnrichmentAPICertification,
} from '@crowd/types/src/premium'
import { DbTransaction } from '@crowd/data-access-layer/src/database'
import { updateMember } from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker'
import {
  insertMemberAttributeSettings,
  insertMemberEnrichmentCache,
  insertMemberIdentity,
  setMemberAttributeSettings,
} from '@crowd/data-access-layer/src/old/apps/premium/members_enrichment_worker/normalize'
import { ENRICH_EMAIL_IDENTITIES } from './config'

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
  if (ENRICH_EMAIL_IDENTITIES) {
    if (enriched.emails && Array.isArray(enriched.emails)) {
      if (enriched.emails.length > 0) {
        const emailSet = new Set<string>(
          enriched.emails.filter((email) => !email.includes('noreply.github')),
        )

        for (const email of emailSet) {
          if (
            member.identities.find(
              (i) => i.type === MemberIdentityType.EMAIL && i.value === email,
            ) === undefined
          ) {
            member.identities.push({
              value: email,
              type: MemberIdentityType.EMAIL,
              platform: 'enrichment',
              verified: false,
            })
          }
        }
      }
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
    if (
      member.identities.find(
        (i) =>
          i.type === MemberIdentityType.USERNAME &&
          i.platform === PlatformType.GITHUB &&
          i.value === enriched.github_handle,
      ) === undefined
    ) {
      member.identities.push({
        value: enriched.github_handle,
        type: MemberIdentityType.USERNAME,
        platform: PlatformType.GITHUB,
        verified: false,
      })
    }
    if (!member.attributes.url) {
      // If it does not exist, initialize it as an empty object
      member.attributes.url = {}
    }
    // Set 'member.attributes.url.github' to be equal to a string concatenated with the 'github_handle' property
    member.attributes.url.github =
      member.attributes.url.github || `https://github.com/${enriched.github_handle}`
  }

  if (enriched.linkedin_url) {
    const linkedinHandle = enriched.linkedin_url.split('/').pop()
    if (
      member.identities.find(
        (i) =>
          i.type === MemberIdentityType.USERNAME &&
          i.platform === PlatformType.LINKEDIN &&
          i.value === linkedinHandle,
      ) === undefined
    ) {
      member.identities.push({
        value: linkedinHandle,
        type: MemberIdentityType.USERNAME,
        platform: PlatformType.LINKEDIN,
        verified: false,
      })
    }
    if (!member.attributes.url) {
      member.attributes.url = {}
    }

    member.attributes.url.linkedin = member.attributes.url.linkedin || enriched.linkedin_url
  }

  if (enriched.twitter_handle) {
    if (
      member.identities.find(
        (i) =>
          i.type === MemberIdentityType.USERNAME &&
          i.platform === PlatformType.TWITTER &&
          i.value === enriched.twitter_handle,
      ) === undefined
    ) {
      member.identities.push({
        value: enriched.twitter_handle,
        type: MemberIdentityType.USERNAME,
        platform: PlatformType.TWITTER,
        verified: false,
      })
    }
    if (!member.attributes.url) {
      member.attributes.url = {}
    }
    member.attributes.url.twitter =
      member.attributes.url.twitter || `https://twitter.com/${enriched.twitter_handle}`
  }

  try {
    // We are updating the displayName only if the existing one has one word only
    // And we are using an update here instead of the upsert because
    // upsert always takes the existing displayName
    let updateDisplayName = false
    if (!/\W/.test(member.displayName)) {
      if (enriched.first_name && enriched.last_name) {
        member.displayName = `${enriched.first_name} ${enriched.last_name}`
        updateDisplayName = true
      }
    }

    await updateMember(
      tx,
      member.tenantId,
      member.id,
      member.displayName,
      updateDisplayName,
      member.attributes,
      member.contributions,
    )
  } catch (err) {
    throw new Error(err)
  }

  for (const identity of member.identities) {
    try {
      await insertMemberIdentity(
        tx,
        identity.platform,
        member.id,
        member.tenantId,
        identity.value,
        identity.type,
        identity.verified,
      )
    } catch (err) {
      throw new Error(err)
    }
  }

  try {
    await insertMemberEnrichmentCache(tx, enriched, member.id)
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
      await setMemberAttributeSettings(tx, options, attributeSettings.id, member.tenantId)
    } catch (err) {
      throw new Error(err)
    }
  }

  // Check if the attribute does not exist and it is not a default attribute
  if (!(lodash.find(member.attributes, { name: attributeName }) || attribute.default)) {
    // Create new attribute if it does not exist
    try {
      await insertMemberAttributeSettings(
        tx,
        attributeName,
        member.tenantId,
        MemberEnrichmentAttributes[attributeName]?.label || MemberAttributes[attributeName].label,
        attribute?.type ||
          MemberEnrichmentAttributes[attributeName]?.type ||
          MemberAttributes[attributeName].type ||
          MemberAttributeType.STRING,
        attributeName !== MemberEnrichmentAttributeName.EMAILS,
        attribute.type === MemberAttributeType.MULTI_SELECT ? attribute.options : [],
      )
    } catch (err) {
      throw new Error(err)
    }
  }

  return member
}
