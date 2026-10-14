import {
  IDbProjectCatalog,
  IDbProjectCatalogClassification,
  ProjectCatalogRoutedAction,
  isReviewAlertProvenance,
} from '@crowd/data-access-layer/src/project-catalog/types'
import { getServiceLogger } from '@crowd/logging'
import { ICatalogRowToClassify } from '@crowd/project-onboarding'

import { IClassifyAndRouteResult } from '../types'

const log = getServiceLogger()

export interface IClassifyAndRouteIo {
  findFresh: (id: string) => Promise<IDbProjectCatalog | null>
  classify: (row: ICatalogRowToClassify) => Promise<IDbProjectCatalogClassification>
  markClassified: (
    id: string,
    classification: IDbProjectCatalogClassification,
  ) => Promise<IDbProjectCatalog | null>
  onRowStart?: (project: IDbProjectCatalog) => void
}

function emptyRoutedCounts(): Record<ProjectCatalogRoutedAction, number> {
  return { evaluate: 0, review: 0, onboard: 0, skip: 0 }
}

function routedByPreviousAttempt(project: IDbProjectCatalog): ProjectCatalogRoutedAction | null {
  if (!project.classifiedAt) {
    return null
  }

  return project.action === 'review' || project.action === 'onboard' || project.action === 'skip'
    ? project.action
    : null
}

function toRowToClassify(project: IDbProjectCatalog): ICatalogRowToClassify {
  return {
    repoUrl: project.repoUrl,
    projectName: project.projectName,
    requestText: project.requestText,
  }
}

export async function classifyAndRouteProjects(
  projects: IDbProjectCatalog[],
  io: IClassifyAndRouteIo,
): Promise<IClassifyAndRouteResult> {
  const result: IClassifyAndRouteResult = {
    remaining: [],
    routed: emptyRoutedCounts(),
    breakdown: {},
    skippedHumanRequests: [],
    discarded: 0,
  }

  const record = (project: IDbProjectCatalog, action: ProjectCatalogRoutedAction) => {
    const kind = project.classificationKind ?? 'unclassified'
    result.routed[action]++
    result.breakdown[kind] = (result.breakdown[kind] ?? 0) + 1

    if (action === 'evaluate') {
      result.remaining.push(project)
    } else if (action === 'skip' && isReviewAlertProvenance(project.provenance)) {
      result.skippedHumanRequests.push({
        project,
        reason: project.skipReason ?? '(no reason provided)',
      })
    }
  }

  for (const project of projects) {
    io.onRowStart?.(project)

    const fresh = await io.findFresh(project.id)
    const previousRoute = fresh ? routedByPreviousAttempt(fresh) : null
    if (fresh && previousRoute) {
      record(fresh, previousRoute)
      continue
    }

    if (!fresh || fresh.action !== 'evaluate') {
      result.discarded++
      log.info(
        { id: project.id, repoUrl: project.repoUrl, action: fresh?.action ?? null },
        'Project was moved out of evaluate by a manual request before classification, discarding.',
      )
      continue
    }

    if (fresh.classifiedAt) {
      record(fresh, 'evaluate')
      continue
    }

    const classification = await io.classify(toRowToClassify(fresh))
    const updated = await io.markClassified(fresh.id, classification)

    if (!updated) {
      result.discarded++
      log.info(
        { id: project.id, repoUrl: project.repoUrl },
        'Project was moved out of evaluate by a manual request while classifying, discarding.',
      )
      continue
    }

    log.info(
      {
        id: updated.id,
        repoUrl: updated.repoUrl,
        classificationKind: classification.classificationKind,
        proposedAction: classification.proposedAction,
        action: classification.action,
        skipReason: classification.skipReason,
      },
      'Project classified and routed.',
    )

    record(updated, classification.action)
  }

  return result
}
