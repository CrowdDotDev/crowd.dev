import { generateUUIDv4 } from '@crowd/common'
import {
  ISecurityInsightsEvaluationSuite,
  ISecurityInsightsEvaluationSuiteControlEvaluation,
  ISecurityInsightsEvaluationSuiteControlEvaluationAssessment,
} from '@crowd/types'

import { QueryExecutor } from '../queryExecutor'

export async function findObsoleteReposQx(
  qx: QueryExecutor,
  insightsObsoleteAfterSeconds: number,
  failedRepos: string[],
  limit = 1000,
): Promise<string[]> {
  const failedReposSubquery =
    failedRepos.length > 0 ? 'and all_repos.repo not in ($(failedRepos:csv))' : ''

  const repos = await qx.select(
    `
        with all_repos as (
            select unnest(repositories) as repo
            from "insightsProjects"
        )
        select repo
        from all_repos
        where not exists (
            select 1
            from "securityInsightsEvaluationSuites" s
            where s.repo = all_repos.repo
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

  return repos?.map((r) => r.repo) || []
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
            ("id", "name", "repo", "catalogId", "result", "corruptedState", "createdAt", "updatedAt")
        values 
            ($(id), $(name), $(repo), $(catalogId), $(result), $(corruptedState), now(), now())
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
                "repo", 
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
                $(repo), 
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
            set "updatedAt"        = EXCLUDED."updatedAt",
                "result"           = EXCLUDED."result",
                "message"          = EXCLUDED."message",
                "corruptedState"   = EXCLUDED."corruptedState",
                "remediationGuide" = EXCLUDED."remediationGuide"
                
    `,
    {
      id: generateUUIDv4(),
      securityInsightsEvaluationSuiteId: evaluation.securityInsightsEvaluationSuiteId,
      repo: evaluation.repo,
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
