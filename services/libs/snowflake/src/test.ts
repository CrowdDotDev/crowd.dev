import fs from 'fs'

import { SnowflakeClient } from './client'
import { GithubSnowflakeClient } from './github'

const privateKeyString = fs.readFileSync(process.env.HOME + '/.sf/rsa_key.p8', 'utf8')

// const sf = new SnowflakeClient({
//   account: 'xmb01974',
//   username: 'DEV_IKOTUA',
//   database: 'GITHUB_EVENTS_INGEST',
//   warehouse: 'DBT_DEV',
//   privateKeyString: privateKeyString,
// })

const sf = new SnowflakeClient({
  account: 'IN53456',
  username: 'IGORKOTUA',
  database: 'GH_ARCHIVE',
  warehouse: 'COMPUTE_WH',
  privateKeyString: privateKeyString,
})

const gh = new GithubSnowflakeClient(sf)

setImmediate(async () => {
  console.log(await sf.run('SELECT 1'))
  //   const res = await gh.getOrgRepositories({ org: 'CrowdDotDev' })
  //   console.log(res)
})
