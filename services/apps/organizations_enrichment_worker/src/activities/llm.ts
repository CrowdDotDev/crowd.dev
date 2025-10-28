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

  // Fetch organization data
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

  // Build organization context
  const pickValues = (name: string, limit = 10) =>
    attributes
      .filter((a) => a.name === name)
      .map((a) => a.value)
      .slice(0, limit)

  const organization = {
    displayName: base?.displayName ?? '',
    description: base.description?.substring(0, 1000),
    phoneNumbers: pickValues('phoneNumber', 3),
    logo: base.logo,
    tags: base.tags,
    location: base.location,
    type: base.type,
    geoLocation: attributes.find((a) => a.name === 'geoLocation')?.value ?? '',
    ticker: attributes.find((a) => a.name === 'ticker')?.value ?? '',
    profiles: pickValues('profile'),
    headline: base.headline,
    industry: base.industry,
    founded: base.founded,
    alternativeNames: pickValues('alternativeName'),
    identities: identities
      .filter((i) => i.type === OrganizationIdentityType.USERNAME && i.verified)
      .map((i) => ({ platform: i.platform, value: i.value }))
      .slice(0, 15),
  }

  const domainValues = domains.map((d) => d.value)

  // Initialize LLM service
  const llmService = new LlmService(
    qx,
    {
      accessKeyId: process.env.CROWD_AWS_BEDROCK_ACCESS_KEY_ID,
      secretAccessKey: process.env.CROWD_AWS_BEDROCK_SECRET_ACCESS_KEY,
    },
    svc.log,
  )

  // Generate prompt
  const PROMPT = `    
    Analyze the following organization data and determine which domain is the most relevant primary domain.

    <organization>
    ${JSON.stringify(organization)}
    </organization>

    <domains>
    ${JSON.stringify(domainValues)}
    </domains>

    REQUIREMENTS:
    - Select exactly ONE domain from <domains>.
    - Do NOT invent, modify, or return any domain not in the list.
    - Use the organization data as context and pick the most relevant domain from the list.
    - Return the EXACT domain string as it appears in the list.

    SELECTION RULES:
    1. Choose the domain representing the organization's main corporate identity and primary brand. 
    2. Use identities (GitHub, LinkedIn, and other social media platforms) to validate the main domain. 
    3. Avoid subsidiary or acquired domains unless they represent the main identity.
    4. Prefer .com if multiple TLDs exist, unless a regional domain is clearly dominant.
    5. Ignore temporary, testing, or unrelated domains.

    OUTPUT FORMAT:
    - Return ONLY valid JSON — no markdown, code fences, explanations, or any extra text.
    - The JSON must begin with '{' and end with '}'.

    {
      "domain": "example.com",
      "reason": "<short explanation>"
    }
  `

  // Execute LLM query
  const executeLlmQuery = async (prompt: string) => {
    const response = await llmService.queryLlm(
      LlmQueryType.SELECT_MOST_RELEVANT_DOMAIN,
      prompt,
      organizationId,
    )
    if (!response) throw new Error('LLM returned no response')
    return JSON.parse(response.answer) as LlmDomainSelection
  }

  try {
    let result = await executeLlmQuery(PROMPT)
    let selectedDomain = domains.find((d) => d.value === result.domain)

    if (selectedDomain) return selectedDomain

    svc.log.warn(
      { organizationId, returnedDomain: result.domain },
      'LLM returned domain not in list, retrying once...',
    )

    result = await executeLlmQuery(
      `
        Your previous selection "${result.domain}" was NOT in the provided domain list.
        You MUST choose one of the following domains only:
        ${domainValues.join(', ')}
        
        Re-read the original instructions below.
        ---------------
        ${PROMPT}
      `,
    )

    selectedDomain = domains.find((d) => d.value === result.domain)
    if (selectedDomain) return selectedDomain

    throw new Error(`LLM retry still returned unknown domain: ${result.domain}`)
  } catch (err) {
    svc.log.error(
      { organizationId, error: (err as Error).message },
      'Failed to select domain with LLM',
    )
    throw err
  }
}
