/* eslint-disable  @typescript-eslint/no-explicit-any */
export enum GerritActivityType {
  CHANGESET_CREATED = 'changeset-CREATED',
  CHANGESET_MERGED = 'changeset-MERGED',
  CHANGESET_CLOSED = 'changeset-CLOSED',
  CHANGESET_ABANDONED = 'changeset-ABANDONED',

  CHANGESET_COMMENT_CREATED = 'changeset_comment-created',

  PATCHSET_CREATED = 'patchset-created',
  PATCHSET_COMMENT_CREATED = 'patchset_comment-created',
  PATCHSET_APPROVAL_CREATED = 'patchset_approval-created',
}
