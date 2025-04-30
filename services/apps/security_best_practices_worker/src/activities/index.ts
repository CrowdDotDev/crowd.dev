import { exec, spawn } from 'child_process'
import { existsSync, readFileSync } from 'fs'
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

import { svc } from '../main'
import { ISecurityInsightsPrivateerResult } from '../types'

export const BINARY_HOME = '/.privateer'

const execAsync = promisify(exec)

export async function getOSPSBaselineInsights(repoUrl: string): Promise<string> {
  // get owner and repo name from url in a single line
  const [owner, repoName] = repoUrl.split('/').slice(-2)

  const REPORT_OUTPUT_FILE_PATH = `${BINARY_HOME}/evaluation_results/${repoName}/${repoName}.json`

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

  // Check if file exists
  if (!existsSync(`${REPORT_OUTPUT_FILE_PATH}`)) {
    throw new Error(`Expected output file not found at ${REPORT_OUTPUT_FILE_PATH}`)
  }

  // Read file contents
  const fileContents = readFileSync(REPORT_OUTPUT_FILE_PATH, 'utf8')
  let parsedJson: ISecurityInsightsPrivateerResult
  try {
    parsedJson = JSON.parse(fileContents)
  } catch (err) {
    throw new Error(`Failed to parse JSON from file: ${err}`)
  }

  // Save file contents to redis
  const key = Math.random().toString(36).substring(7)
  await saveOSPSBaselineInsightsToRedis(key, parsedJson)

  // Delete the file
  await cleanupFiles(repoName)

  return key
}

export async function saveOSPSBaselineInsightsToDB(key: string, repoUrl: string): Promise<void> {
  const CATALOG_ID = 'OSPS_B'
  const redisCache = new RedisCache(`osps-baseline-insights`, svc.redis, svc.log)
  const result = await redisCache.get(key)
  const parsedResult: ISecurityInsightsPrivateerResult = JSON.parse(result)
  const evaluationSuite = parsedResult.Evaluation_Suites.find((s) => s.Catalog_Id === CATALOG_ID)

  const qx = pgpQx(svc.postgres.writer.connection())

  await addEvaluationSuite(qx, {
    repo: repoUrl,
    catalogId: evaluationSuite.Catalog_Id,
    name: evaluationSuite.Name,
    result: evaluationSuite.Result,
    corruptedState: evaluationSuite.Corrupted_State,
  })

  const suite = await findEvaluationSuite(qx, repoUrl, evaluationSuite.Catalog_Id)

  for (const evaluation of evaluationSuite.Control_Evaluations) {
    await addSuiteControlEvaluation(qx, {
      controlId: evaluation.Control_Id,
      corruptedState: evaluation.Corrupted_State,
      message: evaluation.Message,
      repo: repoUrl,
      remediationGuide: evaluation.Remediation_Guide,
      result: evaluation.Result,
      securityInsightsEvaluationSuiteId: suite.id,
    })

    const controlEvaluation = await findSuiteControlEvaluation(qx, repoUrl, evaluation.Control_Id)
    for (const assessment of evaluation.Assessments) {
      await addControlEvaluationAssessment(qx, {
        applicability: assessment.Applicability,
        description: assessment.Description,
        message: assessment.Message,
        repo: repoUrl,
        requirementId: assessment.Requirement_Id,
        result: assessment.Result,
        runDuration: assessment.Run_Duration,
        steps: assessment.Steps,
        stepsExecuted: assessment.Steps_Executed,
        securityInsightsEvaluationSuiteControlEvaluationId: controlEvaluation.id,
      })
    }
  }
}

export async function findObsoleteRepos(
  insightsObsoleteAfterSeconds: number,
  failedRepos: string[],
  limit: number,
): Promise<string[]> {
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
