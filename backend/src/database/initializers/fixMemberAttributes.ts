/**
 * This script is responsible for generating non
 * existing parentIds for historical discord activities
 */

import fetch from 'node-fetch'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'
import TenantService from '../../services/tenantService'
import ActivityService from '../../services/activityService'
import IntegrationService from '../../services/integrationService'
import { getConfig } from '../../config'
import getUserContext from '../utils/getUserContext'
import { PlatformType } from '../../utils/platforms'

const path = require('path')

const env = dotenv.config({
  path: path.resolve(__dirname, `../../../.env.staging`),
})

dotenvExpand.expand(env)

async function fixMemberAttributes() {
  const sampleData = require('./test-sample-data.json')

  for (const member of sampleData) {
    console.log(member)
    const newAttributes = {}

    for (const platform of Object.keys(member.attributes)) {
      for (const attributeName of Object.keys(member.attributes[platform])) {
        if (!newAttributes[attributeName]) {
          newAttributes[attributeName] = {
            [platform]: member.attributes[platform][attributeName],
          }
        } else {
          newAttributes[attributeName][platform] = member.attributes[platform][attributeName]
        }
      }
    }

    member.attributes = newAttributes
  }

  const fs = require('fs')
  fs.writeFileSync('fixed-test-sample-data.json', JSON.stringify(sampleData))
}

fixMemberAttributes()
