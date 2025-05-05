import { generateUUIDv4 } from '@crowd/common'
import {
  ISecurityInsightsEvaluationSuite,
  ISecurityInsightsEvaluationSuiteControlEvaluation,
  ISecurityInsightsEvaluationSuiteControlEvaluationAssessment,
  ISecurityInsightsObsoleteRepo,
} from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function findObsoleteReposQx(
  qx: QueryExecutor,
  insightsObsoleteAfterSeconds: number,
  failedRepos: string[],
  limit = 1000,
): Promise<ISecurityInsightsObsoleteRepo[]> {
  const failedReposSubquery =
    failedRepos.length > 0 ? 'and all_repos."repoUrl" not in ($(failedRepos:csv))' : ''

  const repos: ISecurityInsightsObsoleteRepo[] = await qx.select(
    `
      with all_repos as (
            select
                id as "insightsProjectId",
                slug as "insightsProjectSlug",
                unnest(repositories) as "repoUrl"
            from "insightsProjects"
      )
      select
          "insightsProjectId",
          "insightsProjectSlug",
          "repoUrl"
      from all_repos
      where not exists (
          select 1
          from "securityInsightsEvaluationSuites" s
          where s.repo = all_repos."repoUrl"
          AND EXTRACT(EPOCH FROM (now() - s."updatedAt")) < $(insightsObsoleteAfterSeconds)
      )
      ${failedReposSubquery}
      limit $(limit)
    `,
    {
      insightsObsoleteAfterSeconds,
      limit,
      failedRepos: failedRepos.length > 0 ? failedRepos : undefined,
    },
  )

  return repos || []
}

export async function findEvaluationSuite(
  qx: QueryExecutor,
  repo: string,
  catalogId: string,
): Promise<ISecurityInsightsEvaluationSuite | null> {
  return await qx.selectOneOrNone(
    `
      select *
      from "securityInsightsEvaluationSuites"
      where "repo" = $(repo) and "catalogId" = $(catalogId)
    `,
    {
      repo,
      catalogId,
    },
  )
}

export async function addEvaluationSuite(
  qx: QueryExecutor,
  suite: ISecurityInsightsEvaluationSuite,
): Promise<void> {
  await qx.result(
    `
        insert into "securityInsightsEvaluationSuites"
            ("id", "name", "repo", "insightsProjectId", "insightsProjectSlug", "catalogId", "result", "corruptedState", "createdAt", "updatedAt")
        values 
            ($(id), $(name), $(repo), $(insightsProjectId), $(insightsProjectSlug), $(catalogId), $(result), $(corruptedState), now(), now())
        on conflict ("repo", "catalogId")
            do update
            set "updatedAt"      = EXCLUDED."updatedAt",
                "name"           = EXCLUDED."name",
                "result"         = EXCLUDED."result",
                "corruptedState" = EXCLUDED."corruptedState"
    `,
    {
      id: generateUUIDv4(),
      name: suite.name,
      repo: suite.repo,
      insightsProjectId: suite.insightsProjectId,
      insightsProjectSlug: suite.insightsProjectSlug,
      catalogId: suite.catalogId,
      result: suite.result,
      corruptedState: suite.corruptedState,
    },
  )
}

export async function findSuiteControlEvaluation(
  qx: QueryExecutor,
  repo: string,
  controlId: string,
): Promise<ISecurityInsightsEvaluationSuiteControlEvaluation | null> {
  return await qx.selectOneOrNone(
    `
      select *
      from "securityInsightsEvaluationSuiteControlEvaluations"
      where "repo" = $(repo) and "controlId" = $(controlId)
    `,
    {
      repo,
      controlId,
    },
  )
}

export async function addSuiteControlEvaluation(
  qx: QueryExecutor,
  evaluation: ISecurityInsightsEvaluationSuiteControlEvaluation,
): Promise<void> {
  await qx.result(
    `
        insert into "securityInsightsEvaluationSuiteControlEvaluations"
            (
                "id", 
                "securityInsightsEvaluationSuiteId",
                "name",
                "repo", 
                "insightsProjectId", 
                "insightsProjectSlug",
                "controlId", 
                "result", 
                "message", 
                "corruptedState", 
                "remediationGuide", 
                "createdAt", 
                "updatedAt"
            )
        values 
            (
                $(id), 
                $(securityInsightsEvaluationSuiteId), 
                $(name),
                $(repo), 
                $(insightsProjectId),
                $(insightsProjectSlug),
                $(controlId), 
                $(result),
                $(message),
                $(corruptedState),
                $(remediationGuide),
                now(), 
                now()
            )
        on conflict ("securityInsightsEvaluationSuiteId", "repo", "controlId")
            do update
            set 
                "updatedAt"        = EXCLUDED."updatedAt",
                "name"             = EXCLUDED."name",
                "result"           = EXCLUDED."result",
                "message"          = EXCLUDED."message",
                "corruptedState"   = EXCLUDED."corruptedState",
                "remediationGuide" = EXCLUDED."remediationGuide"
                
    `,
    {
      id: generateUUIDv4(),
      securityInsightsEvaluationSuiteId: evaluation.securityInsightsEvaluationSuiteId,
      name: evaluation.name,
      repo: evaluation.repo,
      insightsProjectId: evaluation.insightsProjectId,
      insightsProjectSlug: evaluation.insightsProjectSlug,
      controlId: evaluation.controlId,
      result: evaluation.result,
      message: evaluation.message,
      corruptedState: evaluation.corruptedState,
      remediationGuide: evaluation.remediationGuide,
    },
  )
}

export async function addControlEvaluationAssessment(
  qx: QueryExecutor,
  assessment: ISecurityInsightsEvaluationSuiteControlEvaluationAssessment,
): Promise<void> {
  await qx.result(
    `
        insert into "securityInsightsEvaluationSuiteControlEvaluationAssessments"
            (
                "id", 
                "securityInsightsEvaluationSuiteControlEvaluationId",
                "repo", 
                "insightsProjectId",
                "insightsProjectSlug",
                "requirementId", 
                "applicability", 
                "description", 
                "result", 
                "message", 
                "steps", 
                "stepsExecuted",
                "runDuration", 
                "createdAt", 
                "updatedAt"
            )
        values 
            (
                $(id), 
                $(securityInsightsEvaluationSuiteControlEvaluationId), 
                $(repo), 
                $(insightsProjectId),
                $(insightsProjectSlug),
                $(requirementId), 
                $(applicability),
                $(description),
                $(result),
                $(message),
                $(steps),
                $(stepsExecuted),
                $(runDuration),
                now(), 
                now()
            )
        on conflict ("securityInsightsEvaluationSuiteControlEvaluationId", "repo", "requirementId")
            do update
            set "updatedAt"      = EXCLUDED."updatedAt",
                "applicability"  = EXCLUDED."applicability",
                "description"    = EXCLUDED."description",
                "result"         = EXCLUDED."result",
                "message"        = EXCLUDED."message",
                "steps"          = EXCLUDED."steps",
                "stepsExecuted"  = EXCLUDED."stepsExecuted",
                "runDuration"    = EXCLUDED."runDuration"
                
    `,
    {
      id: generateUUIDv4(),
      securityInsightsEvaluationSuiteControlEvaluationId:
        assessment.securityInsightsEvaluationSuiteControlEvaluationId,
      repo: assessment.repo,
      insightsProjectId: assessment.insightsProjectId,
      insightsProjectSlug: assessment.insightsProjectSlug,
      requirementId: assessment.requirementId,
      applicability: assessment.applicability,
      description: assessment.description,
      result: assessment.result,
      message: assessment.message,
      steps: assessment.steps,
      stepsExecuted: assessment.stepsExecuted,
      runDuration: assessment.runDuration,
    },
  )
}
