export interface ChunkMethodCounts {
  cdp: number
  email_domain: number
  github_company: number
  unresolved: number
}

export function emptyChunkCounts(): ChunkMethodCounts {
  return { cdp: 0, email_domain: 0, github_company: 0, unresolved: 0 }
}

export function addChunkCounts(a: ChunkMethodCounts, b: ChunkMethodCounts): ChunkMethodCounts {
  return {
    cdp: a.cdp + b.cdp,
    email_domain: a.email_domain + b.email_domain,
    github_company: a.github_company + b.github_company,
    unresolved: a.unresolved + b.unresolved,
  }
}
