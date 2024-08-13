import { GenerateStreamsHandler } from '../../types'
import { GitLabSettings, GitlabStreamType, GitlabRootStream } from './types'

const handler: GenerateStreamsHandler = async (ctx) => {
  const settings = ctx.integration.settings as GitLabSettings
  // Collect all project IDs from user projects and group projects
  const projectIds = [
    ...settings.userProjects.map((project) => project.id.toString()),
    ...Object.values(settings.groupProjects).flatMap((projects) =>
      projects.map((project) => project.id.toString()),
    ),
  ]

  await ctx.publishStream<GitlabRootStream>(GitlabStreamType.ROOT, {
    projectIds,
  })
}

export default handler
