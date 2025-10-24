import { LlmService } from '@crowd/common_services'
import {
  OrganizationField,
  fetchOrgIdentities,
  findOrgAttributes,
  findOrgById,
} from '@crowd/data-access-layer'
import { dbStoreQx } from '@crowd/data-access-layer/src/queryExecutor'
import { IOrganizationIdentity, LlmQueryType, OrganizationIdentityType } from '@crowd/types'

import { svc } from '../main'

interface LlmDomainSelection {
  domain: string
  reason: string
}

export async function selectMostRelevantDomainWithLLM(
  organizationId: string,
  domains: IOrganizationIdentity[],
): Promise<IOrganizationIdentity> {
  const qx = dbStoreQx(svc.postgres.writer)

  // Fetch organization for LLM consumption
  const [base, identities, attributes] = await Promise.all([
    findOrgById(qx, organizationId, [
      OrganizationField.ID,
      OrganizationField.DISPLAY_NAME,
      OrganizationField.DESCRIPTION,
      OrganizationField.LOGO,
      OrganizationField.TAGS,
      OrganizationField.LOCATION,
      OrganizationField.TYPE,
      OrganizationField.HEADLINE,
      OrganizationField.INDUSTRY,
      OrganizationField.FOUNDED,
    ]),
    fetchOrgIdentities(qx, organizationId),
    findOrgAttributes(qx, organizationId),
  ])

  const organization = {
    displayName: base?.displayName || '',
    description: base.description?.substring(0, 1000),
    phoneNumbers: attributes
      .filter((a) => a.name === 'phoneNumber')
      .map((a) => a.value)
      .slice(0, 3),
    logo: base.logo,
    tags: base.tags,
    location: base.location,
    type: base.type,
    geoLocation: attributes.find((a) => a.name === 'geoLocation')?.value || '',
    ticker: attributes.find((a) => a.name === 'ticker')?.value || '',
    profiles: attributes
      .filter((a) => a.name === 'profile')
      .map((a) => a.value)
      .slice(0, 10),
    headline: base.headline,
    industry: base.industry,
    founded: base.founded,
    alternativeNames: attributes
      .filter((a) => a.name === 'alternativeName')
      .map((a) => a.value)
      .slice(0, 10),
    // Include only verified USERNAME identities to maintain clean and reliable organization context
    identities: identities
      .filter((i) => i.type === OrganizationIdentityType.USERNAME && i.verified)
      .map((i) => ({
        platform: i.platform,
        value: i.value,
      }))
      .slice(0, 15),
  }

  // Extract just domain values for the prompt
  const domainValues = domains.map((d) => d.value)

  const PROMPT = `
    Analyze the following organization data and determine which domain is the most relevant primary domain.

    <organization>
    ${JSON.stringify(organization)}
    </organization>

    <domains>
    ${JSON.stringify(domainValues)}
    </domains>

    CRITICAL REQUIREMENT:
    - You MUST select ONE domain from the provided <domains> list above. 
    - Use the organization data as context, and your knowledge to pick the most relevant domain if metadata is missing or ambiguous.  
    - Do NOT modify, clean up, or suggest alternative domains. 
    - Return the EXACT domain string as it appears in the list.

    SELECTION RULES:
    1. Choose the domain representing the organization's main corporate identity and primary brand.
    2. Use identities (GitHub, LinkedIn, social media) to validate the main domain.
    3. Prefer root domains (example.com) over subdomains (ca.example.com, regional.example.com) unless the organization is explicitly regional.
    4. Avoid acquired or subsidiary domains unless they represent the primary identity.
    5. When multiple TLDs exist (example.com, example.co.uk), prefer the global .com unless region-specific.
    6. Ignore temporary, testing, or unrelated domains.

    OUTPUT FORMAT:
    {
        "domain": "example.com",
        "reason": "<short concise explanation>"
    }
    
    You must return ONLY valid JSON.  
    Do NOT include code fences, explanations, markdown, or any extra text.
    The JSON must begin with '{' and end with '}'.
    `

  const llmService = new LlmService(
    qx,
    {
      accessKeyId: process.env['CROWD_AWS_BEDROCK_ACCESS_KEY_ID'],
      secretAccessKey: process.env['CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY'],
    },
    svc.log,
  )

  try {
    const response = await llmService.queryLlm(
      LlmQueryType.SELECT_MOST_RELEVANT_DOMAIN,
      PROMPT,
      organizationId,
    )

    if (!response) throw new Error(`LLM returned no response for organization ${organizationId}`)

    const result = JSON.parse(response.answer) as LlmDomainSelection

    const selectedDomain = domains.find((d) => d.value === result.domain)

    if (!selectedDomain) throw new Error(`LLM returned unknown domain: ${result.domain}`)

    return selectedDomain
  } catch (err) {
    svc.log.error({ organizationId }, 'Failed to select domain with LLM')
    throw err
  }
}
