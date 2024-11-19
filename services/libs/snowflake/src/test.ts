import fs from 'fs'

import { SnowflakeClient } from './client'
import { GithubSnowflakeClient } from './github'

const privateKeyString = fs.readFileSync(process.env.HOME + '/.sf/rsa_key.p8', 'utf8')

const sf = new SnowflakeClient({
  account: 'xmb01974',
  username: 'DEV_IKOTUA',
  database: 'GITHUB_EVENTS_INGEST',
  warehouse: 'DBT_PROD_MED',
  role: 'DBT_TRANSFORM_DEV',
  privateKeyString: privateKeyString,
})

const gh = new GithubSnowflakeClient(sf)

setImmediate(async () => {
  // const res = await gh.getOrgRepositories({ org: 'CrowdDotDev' })
  const res = await gh.getRepoStargazers({ repo: 'garrrikkotua/morningly', perPage: 1 })
  console.log(res)
})
