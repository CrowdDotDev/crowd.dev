import axios from 'axios'

import { createDataIssue } from '@crowd/data-access-layer/src/data_issues'
import { MemberField, findMemberById } from '@crowd/data-access-layer/src/members'
import { OrganizationField, findOrgById } from '@crowd/data-access-layer/src/orgs'
import { PgPromiseQueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { LoggerBase } from '@crowd/logging'
import { DataIssueEntity } from '@crowd/types'

import { JIRA_ISSUE_REPORTER_CONFIG } from '@/conf'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'

import { IServiceOptions } from './IServiceOptions'

export interface IDataIssueCreatePayload {
  entity: DataIssueEntity
  profileUrl: string
  dataIssue: string
  dataType: string
  description: string
  githubIssueUrl: string
  createdById: string
}

interface IJireAPIAuthTokenResponse {
  access_token: string
  token_type: string
  scope: string
  expires_in: number
}

interface IJiraCreateIssueResponse {
  id: string
  key: string
  self: string
  transitions: {
    status: string
    errorCollection: {
      errorMessages: string[]
      errors: object
    }
  }
}

export default class DataIssueService extends LoggerBase {
  private readonly qx: PgPromiseQueryExecutor

  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  public async createDataIssue(data: IDataIssueCreatePayload, entityId: string) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    const user = SequelizeRepository.getCurrentUser(this.options)

    let entityName: string
    let reportedBy: string

    if (data.entity === DataIssueEntity.ORGANIZATION) {
      const organization = await findOrgById(qx, entityId, [
        OrganizationField.ID,
        OrganizationField.DISPLAY_NAME,
      ])
      entityName = organization.displayName
    } else if (data.entity === DataIssueEntity.PERSON) {
      const member = await findMemberById(qx, entityId, [MemberField.ID, MemberField.DISPLAY_NAME])
      entityName = member.displayName
    } else {
      throw new Error(`Unsupported data issue entity ${data.entity}!1`)
    }

    if (user.fullName) {
      reportedBy = `${user.fullName} - ${user.email}`
    } else {
      reportedBy = `${user.email}`
    }

    try {
      const result = await axios.post<IJiraCreateIssueResponse>(
        `${JIRA_ISSUE_REPORTER_CONFIG.apiUrl}/issue`,
        {
          fields: {
            project: {
              key: JIRA_ISSUE_REPORTER_CONFIG.projectKey,
            },
            summary: `[Data Issue] ${entityName} (${data.entity[0].toUpperCase()}${data.entity
              .slice(1)
              .toLowerCase()})`,
            description: `**Entity**\n${entityName}\n\n**Profile**\n[${data.profileUrl}](${data.profileUrl})\n\n**Data Issue**\n${data.dataIssue}\n\n**Description**\n${data.description}\n\n**Reported by**\n${reportedBy}`,
            issuetype: {
              // todo: ask @joana if we should use any other issue type
              name: 'Task',
            },
            labels: ['data-issue'],
          },
        },
        {
          headers: {
            Authorization: `Bearer ${JIRA_ISSUE_REPORTER_CONFIG.apiToken}`,
          },
        },
      )

      const res = await createDataIssue(qx, {
        ...data,
        issueUrl: result.data.self,
        createdById: user.id,
      })

      return res
    } catch (error) {
      this.log.info(error)
      throw new Error('Error during session create!')
    }
  }

  public static async getJiraAuthToken(clientId: string, clientSecret: string): Promise<string> {
    try {
      const response = await axios.post<IJireAPIAuthTokenResponse>(
        'https://auth.atlassian.com/oauth/token',
        {
          grant_type: 'client_credentials',
          client_id: clientId,
          client_secret: clientSecret,
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      return response.data.access_token
    } catch (error) {
      throw new Error('Failed to obtain Jira access token')
    }
  }
}
