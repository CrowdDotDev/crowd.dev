import bigquery from './bigquery/config';
import census from './census/config';
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
import hubspot from './hubspot/config';
import jira from './jira/config';
import lfx from './lfx/config';
import linkedin from './linkedin/config';
import make from './make/config';
import n8n from './n8n/config';
import reddit from './reddit/config';
import salesforce from './salesforce/config';
import segment from './segment/config';
import slack from './slack/config';
import snowflake from './snowflake/config';
import stackoverflow from './stackoverflow/config';
import tnc from './tnc/config';
import twitter from './twitter/config';
import zapier from './zapier/config';

export interface IdentityConfig {
  key: string; // Unique key for the identity
  name: string; // Display name of the identity
  image: string; // Image URL for the identity
  showInMembers: boolean; // If identity is used with contributors
  showInOrganizations: boolean; // If identity is used with organizations
}

export const lfIdentities: Record<string, IdentityConfig> = {
  bigquery,
  census,
  confluence,
  crunchbase,
  cvent,
  devto,
  discord,
  discourse,
  facebook,
  gerrit,
  git,
  github,
  gitlab,
  groupsio,
  hackernews,
  hubspot,
  jira,
  lfx,
  lfid: lfx,
  linkedin,
  make,
  n8n,
  reddit,
  salesforce,
  segment,
  slack,
  snowflake,
  stackoverflow,
  tnc,
  training_cert: tnc,
  twitter,
  zapier,
};
