export interface Category {
  id: string;
  name: string;
  slug: string;
  categoryGroupId: string;
}

export interface CreateCategory {
  name: string;
  categoryGroupId?: string;
}
