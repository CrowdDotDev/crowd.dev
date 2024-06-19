import { Contributor } from '@/modules/contributor/types/Contributor';

export interface NoteAuthor {
  avatarUrl: string | null;
  fullName: string;
  id: string;
}

export interface Note{
  id: string;
  tenantId: string;
  body: string;
  importHash: string | null;
  members: Contributor[];
  createdBy: NoteAuthor;
  createdAt: string;
  createdById: string;
  updatedAt: string;
  updatedById: string;
  deletedAt: string | null;
}
