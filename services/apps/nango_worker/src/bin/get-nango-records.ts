import {
  NANGO_INTEGRATION_CONFIG,
  NangoIntegration,
  getNangoCloudRecords,
  initNangoCloudClient,
} from '@crowd/nango'

setImmediate(async () => {
  const providerConfigKey = NangoIntegration.GITHUB
  const connectionId = 'f50b33a1-cffc-44ce-9402-a96fef4365da'

  await initNangoCloudClient()

  for (const model of Object.values(NANGO_INTEGRATION_CONFIG[providerConfigKey].models)) {
    const records = await getNangoCloudRecords(providerConfigKey, connectionId, model)

    console.log(records)
  }
})
