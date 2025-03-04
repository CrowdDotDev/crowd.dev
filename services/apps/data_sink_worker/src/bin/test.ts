import { executeHTTPQuery } from '@crowd/questdb'

setImmediate(async () => {
  const result = await executeHTTPQuery(`
    
    `)

  console.log(JSON.stringify(result, null, 2))
})
