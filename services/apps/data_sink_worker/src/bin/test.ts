import { queryOverHttp } from '@crowd/questdb'

setImmediate(async () => {
  const query = `
  
  `

  const results = await queryOverHttp(query)

  console.log(JSON.stringify(results))
})
