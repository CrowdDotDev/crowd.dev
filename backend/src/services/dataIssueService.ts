import { Octokit } from '@octokit/core'
import { request } from '@octokit/request'
import { createAppAuth } from '@octokit/auth-app'
import { LoggerBase } from '@crowd/logging'
import { PgPromiseQueryExecutor } from '@crowd/data-access-layer/src/queryExecutor'
import { createDataIssue } from '@crowd/data-access-layer/src/data_issues'
import { findOrgById, OrganizationField } from '@crowd/data-access-layer/src/orgs'
import { findMemberById, MemberField } from '@crowd/data-access-layer/src/members'
import { DataIssueEntity } from '@crowd/types'
import { InstallationAccessTokenData } from '@octokit/auth-app/dist-types/types'
import { IServiceOptions } from './IServiceOptions'
import SequelizeRepository from '@/database/repositories/sequelizeRepository'
import { API_CONFIG, GITHUB_ISSUE_REPORTER_CONFIG } from '@/conf'

export interface IDataIssueCreatePayload {
  entity: DataIssueEntity
  profileUrl: string
  dataIssue: string
  dataType: string
  description: string
  githubIssueUrl: string
  createdById: string
}

export default class DataIssueService extends LoggerBase {
  private readonly qx: PgPromiseQueryExecutor

  private readonly DATA_ISSUES_GITHUB_REPO: string = 'linux-foundation-support'

  private readonly DATA_ISSUES_GITHUB_OWNER: string = 'CrowdDotDev'

  options: IServiceOptions

  constructor(options: IServiceOptions) {
    super(options.log)
    this.options = options
  }

  public async createDataIssue(data: IDataIssueCreatePayload, entityId: string) {
    const qx = SequelizeRepository.getQueryExecutor(this.options)
    const user = SequelizeRepository.getCurrentUser(this.options)

    let entityName: string
    let entityUrl: string
    let reportedBy: string

    if (data.entity === DataIssueEntity.ORGANIZATION) {
      const organization = await findOrgById(qx, entityId, [
        OrganizationField.ID,
        OrganizationField.DISPLAY_NAME,
      ])
      entityName = organization.displayName
      entityUrl = `${API_CONFIG.frontendUrl}/organizations/${organization.id}`
    } else if (data.entity === DataIssueEntity.PERSON) {
      const member = await findMemberById(qx, entityId, [MemberField.ID, MemberField.DISPLAY_NAME])
      entityName = member.displayName
      entityUrl = `${API_CONFIG.frontendUrl}/members/${member.id}`
    } else {
      throw new Error(`Unsupported data issue entity ${data.entity}!1`)
    }

    if (user.fullName) {
      reportedBy = `${user.fullName} - ${user.email}`
    } else {
      reportedBy = `${user.email}`
    }

    const appToken = await DataIssueService.getGitHubAppToken(
      GITHUB_ISSUE_REPORTER_CONFIG.appId,
      GITHUB_ISSUE_REPORTER_CONFIG.privateKey,
      GITHUB_ISSUE_REPORTER_CONFIG.installationId,
    )

    try {
      const result = await request(
        `POST /repos/${this.DATA_ISSUES_GITHUB_OWNER}/${this.DATA_ISSUES_GITHUB_REPO}/issues`,
        {
          headers: {
            authorization: `token ${appToken}`,
          },
          title: `[Data Issue] ${entityName} (${data.entity[0].toUpperCase()}${data.entity
            .slice(1)
            .toLowerCase()})`,
          body: `**Entity**\n${entityName}\n\n**Profile**\n[${entityUrl}](${entityUrl})\n\n**Data Issue**\n${data.dataIssue}\n\n**Description**\n${data.description}\n\n**Reported by**\n${reportedBy}`,
          labels: ['Data issue'],
        },
      )
      const res = await createDataIssue(qx, {
        ...data,
        githubIssueUrl: result.data.html_url,
        createdById: user.id,
        profileUrl: entityUrl,
      })

      return res
    } catch (error) {
      this.log.info(error)
      throw new Error('Error during session create!')
    }
  }

  public static async getGitHubAppToken(
    appId: string,
    privateKey: string,
    installationId: string,
  ): Promise<string> {
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId,
        privateKey,
        installationId,
      },
    })

    const authResponse = await octokit.auth({
      type: 'installation',
      installationId,
    })

    return (authResponse as InstallationAccessTokenData).token
  }
}
