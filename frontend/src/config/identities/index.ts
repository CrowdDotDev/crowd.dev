import { ContributorAttribute, ContributorIdentity } from '@/modules/contributor/types/Contributor';
import confluence from './confluence/config';
import crunchbase from './crunchbase/config';
import cvent from './cvent/config';
import devto from './devto/config';
import discord from './discord/config';
import discourse from './discourse/config';
import facebook from './facebook/config';
import gerrit from './gerrit/config';
import git from './git/config';
import github from './github/config';
import gitlab from './gitlab/config';
import groupsio from './groupsio/config';
import hackernews from './hackernews/config';
import jira from './jira/config';
import lfx from './lfx/config';
import linkedin from './linkedin/config';
import n8n from './n8n/config';
import reddit from './reddit/config';
import slack from './slack/config';
import stackoverflow from './stackoverflow/config';
import tnc from './tnc/config';
import twitter from './twitter/config';

export interface IdentityConfig {
  key: string; // Unique key for the identity
  name: string; // Display name of the identity
  image: string; // Image URL for the identity
  icon?: string; // Image URL for the identity
  color?: string; // Image URL for the identity
  member?: {
    placeholder?: string;
    urlPrefix?: string;
    url?: ({ identity, attributes }: { identity: ContributorIdentity; attributes: Record<string, ContributorAttribute> }) => string | null;
  },
  organization?: {
    urlPrefix?: string;
  }
}

export const lfIdentities: Record<string, IdentityConfig> = {
  github,
  discord,
  hackernews,
  linkedin,
  twitter,
  slack,
  devto,
  reddit,
  stackoverflow,
  discourse,
  git,
  groupsio,
  confluence,
  gerrit,
  jira,
  cvent,
  lfx,
  tnc,
  gitlab,
  crunchbase,
  facebook,
  lfid: lfx,
  n8n,
  training_cert: tnc,
};
