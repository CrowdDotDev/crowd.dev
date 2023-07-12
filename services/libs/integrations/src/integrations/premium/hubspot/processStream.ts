import { ProcessStreamHandler } from '@/types'
import { HubspotStream, IHubspotData } from './types'
import { getAllContacts } from './api/contacts'
import { HubspotFieldMapper } from './hubspotFieldMapper'

const processRootStream: ProcessStreamHandler = async (ctx) => {
  if (ctx.stream.identifier.startsWith(HubspotStream.MEMBERS)) {
    const mapper = new HubspotFieldMapper()
    mapper.setMembersFieldMap((ctx.integration.settings as any).attributesMapping.members)

    const contacts = await getAllContacts(ctx.serviceSettings.nangoId, mapper, ctx)

    while (contacts.length > 0) {
      const contact = contacts.shift()
      await ctx.publishData<IHubspotData>({
        type: HubspotStream.MEMBERS,
        element: contact,
      })
    }
  } else {
    await ctx.abortWithError(`Unknown root stream identifier: ${ctx.stream.identifier}`)
  }
}

const handler: ProcessStreamHandler = async (ctx) => {
  await processRootStream(ctx)
}

export default handler
