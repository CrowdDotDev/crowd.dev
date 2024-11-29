/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios'

// import { writeFileSync } from 'fs'
// import { Parser } from 'json2csv'
import { timeout } from '@crowd/common'

const testSerpApi = async () => {
  const members = [] as any[]

  for (const mem of members) {
    const url = `https://serpapi.com/search.json`
    const config = {
      method: 'get',
      url,
      params: {
        api_key: process.env['CROWD_SERP_API_KEY'],
        q: `"${mem.displayName}" ${mem.location} "${mem.website}" site:linkedin.com/in`,
        num: 3,
        engine: 'google',
      },
    }

    const response = (await axios(config)).data

    if (response.search_information.total_results > 0) {
      if (
        response.organic_results.length > 0 &&
        response.organic_results[0].link &&
        !response.search_information.spelling_fix &&
        !response.search_information.spelling_fix_type
      ) {
        console.log(`Found LinkedIn for ${mem.displayName}: ${response.organic_results[0].link}`)
        console.log(response.search_information)
        mem.linkedinFromSerp = response.organic_results[0].link
      } else {
        console.log(`No LinkedIn found for ${mem.displayName}`)
      }
    } else {
      console.log(`No LinkedIn found for ${mem.displayName}`)
    }

    await timeout(1000)
  }

  try {
    // const fields = [
    //   'id',
    //   'displayName',
    //   'location',
    //   'profileUrl',
    //   'website',
    //   'linkedinFromClearbit',
    //   'linkedinFromProgai',
    //   'linkedinFromSerp',
    // ]
    // const json2csvParser = new Parser({ fields })
    // const csv = json2csvParser.parse(members)
    // writeFileSync('output.csv', csv)
    // console.log('CSV file has been successfully written.')
  } catch (err) {
    console.error('Error writing CSV file:', err)
  }
}

setImmediate(async () => {
  await testSerpApi()
  process.exit(0)
})
