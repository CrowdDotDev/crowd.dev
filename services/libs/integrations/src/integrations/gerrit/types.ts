/* eslint-disable  @typescript-eslint/no-explicit-any */
export enum GerritActivityType {
  CHANGESET_CREATED = 'changeset-created',
  CHANGESET_MERGED = 'changeset-merged',
  CHANGESET_CLOSED = 'changeset-closed',
  CHANGESET_ABANDONED = 'changeset-abandoned',

  CHANGESET_COMMENT_CREATED = 'changeset_comment-created',

  PATCHSET_CREATED = 'patchset-created',
  PATCHSET_COMMENT_CREATED = 'patchset_comment-created',
  PATCHSET_APPROVAL_CREATED = 'patchset_approval-created',
}
