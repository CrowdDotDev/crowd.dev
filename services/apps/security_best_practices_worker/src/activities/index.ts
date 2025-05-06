import { exec, spawn } from 'child_process'
import { existsSync, readFileSync } from 'fs'
import { load as parseYaml } from 'js-yaml'
import { promisify } from 'util'

import {
  addControlEvaluationAssessment,
  addEvaluationSuite,
  addSuiteControlEvaluation,
  findEvaluationSuite,
  findObsoleteReposQx,
  findSuiteControlEvaluation,
} from '@crowd/data-access-layer'
import { pgpQx } from '@crowd/data-access-layer/src/queryExecutor'
import { RedisCache } from '@crowd/redis'
import { ISecurityInsightsObsoleteRepo } from '@crowd/types'

import { svc } from '../main'
import { ISecurityInsightsPrivateerResult } from '../types'

export const BINARY_HOME = '/.privateer'

const execAsync = promisify(exec)

export async function getOSPSBaselineInsights(repoUrl: string): Promise<string> {
  // get owner and repo name from url
  const [owner, repoName] = repoUrl.split('/').slice(-2)

  const REPORT_OUTPUT_FILE_PATH = `${BINARY_HOME}/evaluation_results/${repoName.toLowerCase()}/${repoName.toLowerCase()}.yaml`

  // prepare config file for privateer
  await execAsync(
    `cp ${BINARY_HOME}/example-config.yml ${BINARY_HOME}/${repoName}.yml &&
     sed -i.bak -e "s/\\$REPO_NAME/${repoName}/g" -e "s/\\$REPO_OWNER/${owner}/g" -e "s/\\$GITHUB_TOKEN/${process.env.CROWD_SECURITY_INSIGHTS_GITHUB_TOKEN}/g" ${BINARY_HOME}/${repoName}.yml && rm ${BINARY_HOME}/${repoName}.yml.bak`,
  )

  await runBinary(`${BINARY_HOME}/bin/privateer`, [
    'run',
    '--config',
    `${BINARY_HOME}/${repoName}.yml`,
  ])

  // check if the output file exists
  if (!existsSync(`${REPORT_OUTPUT_FILE_PATH}`)) {
    throw new Error(`Expected output file not found at ${REPORT_OUTPUT_FILE_PATH}!`)
  }

  let parsedYaml: ISecurityInsightsPrivateerResult
  try {
    const fileContents = readFileSync(REPORT_OUTPUT_FILE_PATH, 'utf8')
    parsedYaml = parseYaml(fileContents) as ISecurityInsightsPrivateerResult
  } catch (err) {
    throw new Error(`Failed to parse YAML from file: ${err}`)
  }

  // save file contents to redis
  const key = Math.random().toString(36).substring(7)
  await saveOSPSBaselineInsightsToRedis(key, parsedYaml)

  // cleanup generated files
  await cleanupFiles(repoName)

  return key
}

export async function saveOSPSBaselineInsightsToDB(
  key: string,
  repo: ISecurityInsightsObsoleteRepo,
): Promise<void> {
  const CATALOG_ID = 'OSPS_B'
  const redisCache = new RedisCache(`osps-baseline-insights`, svc.redis, svc.log)
  const result = await redisCache.get(key)
  const parsedResult: ISecurityInsightsPrivateerResult = JSON.parse(result)
  const evaluationSuite = parsedResult.evaluation_suites.find((s) => s.catalog_id === CATALOG_ID)

  const qx = pgpQx(svc.postgres.writer.connection())

  await addEvaluationSuite(qx, {
    repo: repo.repoUrl,
    insightsProjectId: repo.insightsProjectId,
    insightsProjectSlug: repo.insightsProjectSlug,
    catalogId: evaluationSuite.catalog_id,
    name: evaluationSuite.name,
    result: evaluationSuite.result,
    corruptedState: evaluationSuite.corrupted_state,
  })

  const suite = await findEvaluationSuite(qx, repo.repoUrl, evaluationSuite.catalog_id)

  for (const evaluation of evaluationSuite.control_evaluations) {
    await addSuiteControlEvaluation(qx, {
      controlId: evaluation.control_id,
      name: evaluation.name,
      corruptedState: evaluation.corrupted_state,
      message: evaluation.message,
      repo: repo.repoUrl,
      insightsProjectId: repo.insightsProjectId,
      insightsProjectSlug: repo.insightsProjectSlug,
      remediationGuide: evaluation.remediation_guide,
      result: evaluation.result,
      securityInsightsEvaluationSuiteId: suite.id,
    })

    const controlEvaluation = await findSuiteControlEvaluation(
      qx,
      repo.repoUrl,
      evaluation.control_id,
    )
    for (const assessment of evaluation.assessments) {
      await addControlEvaluationAssessment(qx, {
        applicability: assessment.applicability,
        description: assessment.description,
        message: assessment.message,
        repo: repo.repoUrl,
        insightsProjectId: repo.insightsProjectId,
        insightsProjectSlug: repo.insightsProjectSlug,
        requirementId: assessment.requirement_id,
        result: assessment.result,
        runDuration: assessment.run_duration,
        steps: assessment.steps,
        stepsExecuted: assessment.steps_executed,
        securityInsightsEvaluationId: controlEvaluation.id,
      })
    }
  }
}

export async function findObsoleteRepos(
  insightsObsoleteAfterSeconds: number,
  failedRepos: string[],
  limit: number,
): Promise<ISecurityInsightsObsoleteRepo[]> {
  const qx = pgpQx(svc.postgres.reader.connection())
  return findObsoleteReposQx(qx, insightsObsoleteAfterSeconds, failedRepos, limit)
}

export async function saveOSPSBaselineInsightsToRedis(
  key: string,
  insights: ISecurityInsightsPrivateerResult,
): Promise<void> {
  const redisCache = new RedisCache(`osps-baseline-insights`, svc.redis, svc.log)
  await redisCache.set(key, JSON.stringify(insights), 60 * 60 * 24) // 1 day
}

async function cleanupFiles(repoName: string): Promise<void> {
  // Delete the file
  try {
    await execAsync(
      `rm -rf ${BINARY_HOME}/evaluation_results/${repoName} && rm ${BINARY_HOME}/${repoName}.yml`,
    )

    svc.log.info(`Cleaned generated files for repo: ${repoName}`)
  } catch (err) {
    svc.log.error(`Failed to clean generated files for repo: ${repoName}`)
    throw new Error(`Failed to clean generated files for repo: ${repoName}`)
  }
}

async function runBinary(binaryPath: string, args: string[] = []): Promise<void> {
  return new Promise((resolve, reject) => {
    svc.log.info(`Running binary: ${binaryPath} with args: ${args.join(' ')}`)
    const proc = spawn(binaryPath, args, {
      stdio: 'inherit',
      cwd: '/.privateer',
    })

    proc.on('error', (err) => {
      svc.log.info(`Error running binary: ${err}`)
      reject(err)
    })

    proc.on('exit', (code) => {
      if (code === 0) {
        svc.log.info(`Binary completed successfully with code ${code}`)
        resolve()
      } else {
        reject(new Error(`Binary exited with code ${code}`))
      }
    })
  })
}
