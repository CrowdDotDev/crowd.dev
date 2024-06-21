import { Contributor } from '@/modules/contributor/types/Contributor';

export interface ContributorState {
  contributor: Contributor | null;
}

export default () => ({
  contributor: null,
} as ContributorState);
