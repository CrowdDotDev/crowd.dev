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

    REQUIREMENTS:
    - Select exactly ONE domain that appears in <domains>.
    - Do NOT invent, modify, or output any domain not in the list.
    - The "domain" value MUST exactly match one from <domains>.
    - Use organization data (e.g., website, LinkedIn, GitHub) to identify the main corporate identity.

    SELECTION RULES:
    1. Prefer the main corporate/root domain (e.g., example.com) over subdomains unless region-specific.
    2. Avoid subsidiary or acquired domains unless they represent the primary brand.
    3. Prefer .com if multiple TLDs exist, unless a regional domain is clearly dominant.
    4. Ignore temporary, testing, or unrelated domains.

    VALIDATION:
    - Before output, confirm the selected domain exactly matches one in <domains>.
    - If it doesn't, replace it with the closest valid match.

    OUTPUT FORMAT:
    {
        "domain": "example.com",
        "reason": "<short concise explanation>"
    }
    
    IMPORTANT:
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
