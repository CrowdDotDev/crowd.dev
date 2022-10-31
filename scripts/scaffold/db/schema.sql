--
-- PostgreSQL database dump
--

-- Dumped from database version 13.6
-- Dumped by pg_dump version 13.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: enum_memberAttributeSettings_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."enum_memberAttributeSettings_type" AS ENUM (
    'boolean',
    'number',
    'email',
    'string',
    'url',
    'date'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activities (
    id uuid NOT NULL,
    type text NOT NULL,
    "timestamp" timestamp with time zone NOT NULL,
    platform text NOT NULL,
    "isKeyAction" boolean DEFAULT false NOT NULL,
    score integer DEFAULT 2,
    "sourceId" text NOT NULL,
    "sourceParentId" character varying(255),
    attributes jsonb DEFAULT '{}'::jsonb NOT NULL,
    channel text,
    body text,
    title text,
    url text,
    sentiment jsonb DEFAULT '{}'::jsonb,
    "importHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "memberId" uuid NOT NULL,
    "conversationId" uuid,
    "parentId" uuid,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: activityTasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."activityTasks" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "activityId" uuid NOT NULL,
    "taskId" uuid NOT NULL
);


--
-- Name: auditLogs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."auditLogs" (
    id uuid NOT NULL,
    "entityName" character varying(255) NOT NULL,
    "entityId" character varying(255) NOT NULL,
    "tenantId" uuid,
    action character varying(32) NOT NULL,
    "createdById" uuid,
    "createdByEmail" character varying(255),
    "timestamp" timestamp with time zone NOT NULL,
    "values" json NOT NULL
);


--
-- Name: automationExecutions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."automationExecutions" (
    id uuid NOT NULL,
    "automationId" uuid NOT NULL,
    type character varying(80) NOT NULL,
    "tenantId" uuid NOT NULL,
    trigger character varying(80) NOT NULL,
    state character varying(80) NOT NULL,
    error json,
    "executedAt" timestamp with time zone NOT NULL,
    "eventId" character varying(255) NOT NULL,
    payload json NOT NULL
);


--
-- Name: automations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.automations (
    id uuid NOT NULL,
    type character varying(80) NOT NULL,
    "tenantId" uuid NOT NULL,
    trigger character varying(80) NOT NULL,
    settings jsonb NOT NULL,
    state character varying(80) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: conversationSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."conversationSettings" (
    id uuid NOT NULL,
    enabled boolean DEFAULT false,
    "customUrl" text,
    "logoUrl" text,
    "faviconUrl" text,
    theme jsonb,
    "autoPublish" jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "tenantId" uuid,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conversations (
    id uuid NOT NULL,
    title text NOT NULL,
    slug text NOT NULL,
    published boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: eagleEyeContents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."eagleEyeContents" (
    id uuid NOT NULL,
    "sourceId" text NOT NULL,
    "vectorId" text NOT NULL,
    status character varying(255) DEFAULT NULL::character varying,
    title text NOT NULL,
    username text NOT NULL,
    url text NOT NULL,
    text text,
    "timestamp" timestamp with time zone NOT NULL,
    platform text NOT NULL,
    keywords text[],
    "similarityScore" double precision,
    "userAttributes" jsonb,
    "postAttributes" jsonb,
    "importHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: files; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.files (
    id uuid NOT NULL,
    "belongsTo" character varying(255) NOT NULL,
    "belongsToId" character varying(255) NOT NULL,
    "belongsToColumn" character varying(255) NOT NULL,
    name character varying(2083) NOT NULL,
    "sizeInBytes" integer,
    "privateUrl" character varying(2083),
    "publicUrl" character varying(2083),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "tenantId" uuid,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: integrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.integrations (
    id uuid NOT NULL,
    platform text,
    status text,
    "limitCount" integer,
    "limitLastResetAt" timestamp with time zone,
    token text,
    "refreshToken" text,
    settings jsonb DEFAULT '{}'::jsonb,
    "integrationIdentifier" text,
    "importHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: memberActivityAggregatesMVs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."memberActivityAggregatesMVs" (
    id uuid NOT NULL,
    "lastActive" timestamp with time zone NOT NULL,
    "activeOn" character varying(255)[],
    "averageSentiment" double precision,
    "activityCount" integer,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL
);


--
-- Name: memberAttributeSettings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."memberAttributeSettings" (
    id uuid NOT NULL,
    type public."enum_memberAttributeSettings_type" NOT NULL,
    "canDelete" boolean DEFAULT true NOT NULL,
    show boolean DEFAULT true NOT NULL,
    label text NOT NULL,
    name text NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: memberNoMerge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."memberNoMerge" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "memberId" uuid NOT NULL,
    "noMergeId" uuid NOT NULL
);


--
-- Name: memberNotes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."memberNotes" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "memberId" uuid NOT NULL,
    "noteId" uuid NOT NULL
);


--
-- Name: memberOrganizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."memberOrganizations" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "memberId" uuid NOT NULL,
    "organizationId" uuid NOT NULL
);


--
-- Name: memberTags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."memberTags" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "memberId" uuid NOT NULL,
    "tagId" uuid NOT NULL
);


--
-- Name: memberTasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."memberTasks" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "memberId" uuid NOT NULL,
    "taskId" uuid NOT NULL
);


--
-- Name: memberToMerge; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."memberToMerge" (
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "memberId" uuid NOT NULL,
    "toMergeId" uuid NOT NULL
);


--
-- Name: members; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.members (
    id uuid NOT NULL,
    username jsonb NOT NULL,
    attributes jsonb DEFAULT '{}'::jsonb,
    "displayName" text NOT NULL,
    email text,
    score integer DEFAULT '-1'::integer,
    "joinedAt" timestamp with time zone NOT NULL,
    "importHash" character varying(255),
    reach jsonb DEFAULT '{"total": -1}'::jsonb,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: microservices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.microservices (
    id uuid NOT NULL,
    init boolean DEFAULT false NOT NULL,
    running boolean DEFAULT false NOT NULL,
    type text NOT NULL,
    variant text DEFAULT 'default'::text,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    "importHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id uuid NOT NULL,
    body text NOT NULL,
    "importHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: organizationCaches; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."organizationCaches" (
    id uuid NOT NULL,
    name text NOT NULL,
    url text,
    description text,
    "parentUrl" text,
    emails text[],
    "phoneNumbers" text[],
    logo text,
    tags text[],
    twitter jsonb,
    linkedin jsonb,
    crunchbase jsonb,
    employees integer,
    "revenueRange" jsonb,
    "importHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone
);


--
-- Name: organizations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.organizations (
    id uuid NOT NULL,
    name text NOT NULL,
    url text,
    description text,
    "parentUrl" text,
    emails text[],
    "phoneNumbers" text[],
    logo text,
    tags text[],
    twitter jsonb,
    linkedin jsonb,
    crunchbase jsonb,
    employees integer,
    "revenueRange" jsonb,
    "importHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: reports; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reports (
    id uuid NOT NULL,
    public boolean DEFAULT false NOT NULL,
    name text NOT NULL,
    "importHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.settings (
    id character varying(255) DEFAULT 'default'::character varying NOT NULL,
    website character varying(255),
    "backgroundImageUrl" character varying(1024),
    "logoUrl" character varying(1024),
    "attributeSettings" jsonb DEFAULT '{"priorities": ["custom", "twitter", "github", "devto", "slack", "discord", "crowd"]}'::jsonb NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: tags; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tags (
    id uuid NOT NULL,
    name text NOT NULL,
    "importHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id uuid NOT NULL,
    name text NOT NULL,
    body text,
    status character varying(255) DEFAULT NULL::character varying,
    "dueDate" timestamp with time zone,
    "importHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "tenantId" uuid NOT NULL,
    "assignedToId" uuid,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: tenantUsers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."tenantUsers" (
    id uuid NOT NULL,
    roles text[],
    "invitationToken" character varying(255),
    status character varying(255) NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "tenantId" uuid,
    "userId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: tenants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tenants (
    id uuid NOT NULL,
    name character varying(255) NOT NULL,
    url character varying(50) NOT NULL,
    "integrationsRequired" character varying(50)[],
    "communitySize" character varying(50),
    plan character varying(255) DEFAULT 'free'::character varying NOT NULL,
    "planStatus" character varying(255) DEFAULT 'active'::character varying NOT NULL,
    "planStripeCustomerId" character varying(255),
    "planUserId" uuid,
    "onboardedAt" timestamp with time zone,
    "hasSampleData" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid NOT NULL,
    "fullName" character varying(255),
    "firstName" character varying(80),
    password character varying(255),
    "emailVerified" boolean DEFAULT false NOT NULL,
    "emailVerificationToken" character varying(255),
    "emailVerificationTokenExpiresAt" timestamp with time zone,
    provider character varying(255),
    "providerId" character varying(2024),
    "passwordResetToken" character varying(255),
    "passwordResetTokenExpiresAt" timestamp with time zone,
    "lastName" character varying(175),
    "phoneNumber" character varying(24),
    email character varying(255) NOT NULL,
    "jwtTokenInvalidBefore" timestamp with time zone,
    "importHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: widgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.widgets (
    id uuid NOT NULL,
    type text NOT NULL,
    title text,
    settings jsonb,
    cache jsonb,
    "importHash" character varying(255),
    "createdAt" timestamp with time zone NOT NULL,
    "updatedAt" timestamp with time zone NOT NULL,
    "deletedAt" timestamp with time zone,
    "reportId" uuid,
    "tenantId" uuid NOT NULL,
    "createdById" uuid,
    "updatedById" uuid
);


--
-- Name: activities activities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT activities_pkey PRIMARY KEY (id);


--
-- Name: activityTasks activityTasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."activityTasks"
    ADD CONSTRAINT "activityTasks_pkey" PRIMARY KEY ("activityId", "taskId");


--
-- Name: auditLogs auditLogs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."auditLogs"
    ADD CONSTRAINT "auditLogs_pkey" PRIMARY KEY (id);


--
-- Name: automationExecutions automationExecutions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."automationExecutions"
    ADD CONSTRAINT "automationExecutions_pkey" PRIMARY KEY (id);


--
-- Name: automations automations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT automations_pkey PRIMARY KEY (id);


--
-- Name: conversationSettings conversationSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."conversationSettings"
    ADD CONSTRAINT "conversationSettings_pkey" PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: eagleEyeContents eagleEyeContents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."eagleEyeContents"
    ADD CONSTRAINT "eagleEyeContents_pkey" PRIMARY KEY (id);


--
-- Name: files files_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT files_pkey PRIMARY KEY (id);


--
-- Name: integrations integrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT integrations_pkey PRIMARY KEY (id);


--
-- Name: memberActivityAggregatesMVs memberActivityAggregatesMVs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberActivityAggregatesMVs"
    ADD CONSTRAINT "memberActivityAggregatesMVs_pkey" PRIMARY KEY (id);


--
-- Name: memberAttributeSettings memberAttributeSettings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberAttributeSettings"
    ADD CONSTRAINT "memberAttributeSettings_pkey" PRIMARY KEY (id);


--
-- Name: memberNoMerge memberNoMerge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberNoMerge"
    ADD CONSTRAINT "memberNoMerge_pkey" PRIMARY KEY ("memberId", "noMergeId");


--
-- Name: memberNotes memberNotes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberNotes"
    ADD CONSTRAINT "memberNotes_pkey" PRIMARY KEY ("memberId", "noteId");


--
-- Name: memberOrganizations memberOrganizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberOrganizations"
    ADD CONSTRAINT "memberOrganizations_pkey" PRIMARY KEY ("memberId", "organizationId");


--
-- Name: memberTags memberTags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberTags"
    ADD CONSTRAINT "memberTags_pkey" PRIMARY KEY ("memberId", "tagId");


--
-- Name: memberTasks memberTasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberTasks"
    ADD CONSTRAINT "memberTasks_pkey" PRIMARY KEY ("memberId", "taskId");


--
-- Name: memberToMerge memberToMerge_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberToMerge"
    ADD CONSTRAINT "memberToMerge_pkey" PRIMARY KEY ("memberId", "toMergeId");


--
-- Name: members members_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT members_pkey PRIMARY KEY (id);


--
-- Name: microservices microservices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microservices
    ADD CONSTRAINT microservices_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: organizationCaches organizationCaches_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."organizationCaches"
    ADD CONSTRAINT "organizationCaches_pkey" PRIMARY KEY (id);


--
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: settings settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT settings_pkey PRIMARY KEY (id);


--
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: tenantUsers tenantUsers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."tenantUsers"
    ADD CONSTRAINT "tenantUsers_pkey" PRIMARY KEY (id);


--
-- Name: tenants tenants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT tenants_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: widgets widgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT widgets_pkey PRIMARY KEY (id);


--
-- Name: activities_conversation_id_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_conversation_id_tenant_id ON public.activities USING btree ("conversationId", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: activities_deleted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_deleted_at ON public.activities USING btree ("deletedAt");


--
-- Name: activities_import_hash_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX activities_import_hash_tenant_id ON public.activities USING btree ("importHash", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: activities_member_id_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_member_id_tenant_id ON public.activities USING btree ("memberId", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: activities_parent_id_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_parent_id_tenant_id ON public.activities USING btree ("parentId", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: activities_platform_tenant_id_type_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_platform_tenant_id_type_timestamp ON public.activities USING btree (platform, "tenantId", type, "timestamp") WHERE ("deletedAt" IS NULL);


--
-- Name: activities_source_id_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_source_id_tenant_id ON public.activities USING btree ("sourceId", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: activities_source_parent_id_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_source_parent_id_tenant_id ON public.activities USING btree ("sourceParentId", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: activities_timestamp_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activities_timestamp_tenant_id ON public.activities USING btree ("timestamp", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: automation_executions_automation_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX automation_executions_automation_id ON public."automationExecutions" USING btree ("automationId");


--
-- Name: automations_type_tenant_id_trigger_state; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX automations_type_tenant_id_trigger_state ON public.automations USING btree (type, "tenantId", trigger, state);


--
-- Name: conversations_slug_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX conversations_slug_tenant_id ON public.conversations USING btree (slug, "tenantId");


--
-- Name: discord; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX discord ON public.members USING btree (((username ->> 'discord'::text)));


--
-- Name: eagle_eye_contents_import_hash_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX eagle_eye_contents_import_hash_tenant_id ON public."eagleEyeContents" USING btree ("importHash", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: eagle_eye_contents_platform_tenant_id_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX eagle_eye_contents_platform_tenant_id_timestamp ON public."eagleEyeContents" USING btree (platform, "tenantId", "timestamp") WHERE ("deletedAt" IS NULL);


--
-- Name: eagle_eye_contents_status_tenant_id_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX eagle_eye_contents_status_tenant_id_timestamp ON public."eagleEyeContents" USING btree (status, "tenantId", "timestamp") WHERE ("deletedAt" IS NULL);


--
-- Name: eagle_eye_contents_tenant_id_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX eagle_eye_contents_tenant_id_timestamp ON public."eagleEyeContents" USING btree ("tenantId", "timestamp") WHERE ("deletedAt" IS NULL);


--
-- Name: github; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX github ON public.members USING btree (((username ->> 'github'::text)));


--
-- Name: integrations_import_hash_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX integrations_import_hash_tenant_id ON public.integrations USING btree ("importHash", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: integrations_integration_identifier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX integrations_integration_identifier ON public.integrations USING btree ("integrationIdentifier");


--
-- Name: member_attribute_settings_name_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX member_attribute_settings_name_tenant_id ON public."memberAttributeSettings" USING btree (name, "tenantId");


--
-- Name: members_created_at_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX members_created_at_tenant_id ON public.members USING btree ("createdAt", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: members_email_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX members_email_tenant_id ON public.members USING btree (email, "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: members_import_hash_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX members_import_hash_tenant_id ON public.members USING btree ("importHash", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: members_joined_at_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX members_joined_at_tenant_id ON public.members USING btree ("joinedAt", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: members_score_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX members_score_tenant_id ON public.members USING btree (score, "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: members_username; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX members_username ON public.members USING gin (username jsonb_path_ops);


--
-- Name: microservices_import_hash_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX microservices_import_hash_tenant_id ON public.microservices USING btree ("importHash", "tenantId");


--
-- Name: microservices_type_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX microservices_type_tenant_id ON public.microservices USING btree (type, "tenantId");


--
-- Name: organization_caches_url; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organization_caches_url ON public."organizationCaches" USING btree (url) WHERE (("deletedAt" IS NULL) AND (url IS NOT NULL));


--
-- Name: organizations_import_hash_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organizations_import_hash_tenant_id ON public.organizations USING btree ("importHash", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: organizations_name_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organizations_name_tenant_id ON public.organizations USING btree (name, "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: organizations_url_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX organizations_url_tenant_id ON public.organizations USING btree (url, "tenantId") WHERE (("deletedAt" IS NULL) AND (url IS NOT NULL));


--
-- Name: reports_import_hash_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reports_import_hash_tenant_id ON public.reports USING btree ("importHash", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: slack; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX slack ON public.members USING btree (((username ->> 'slack'::text)));


--
-- Name: tags_import_hash_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tags_import_hash_tenant_id ON public.tags USING btree ("importHash", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: tags_name_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tags_name_tenant_id ON public.tags USING btree (name, "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: tasks_import_hash_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tasks_import_hash_tenant_id ON public.tasks USING btree ("importHash", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: tasks_name_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_name_tenant_id ON public.tasks USING btree (name, "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: tenants_url; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX tenants_url ON public.tenants USING btree (url) WHERE ("deletedAt" IS NULL);


--
-- Name: twitter; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX twitter ON public.members USING btree (((username ->> 'twitter'::text)));


--
-- Name: users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email ON public.users USING btree (email) WHERE ("deletedAt" IS NULL);


--
-- Name: users_import_hash; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_import_hash ON public.users USING btree ("importHash") WHERE ("deletedAt" IS NULL);


--
-- Name: widgets_import_hash_tenant_id; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX widgets_import_hash_tenant_id ON public.widgets USING btree ("importHash", "tenantId") WHERE ("deletedAt" IS NULL);


--
-- Name: activities activities_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public.conversations(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activities activities_parentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES public.activities(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activities activities_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: activities activities_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activities
    ADD CONSTRAINT "activities_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activityTasks activityTasks_activityId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."activityTasks"
    ADD CONSTRAINT "activityTasks_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES public.activities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activityTasks activityTasks_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."activityTasks"
    ADD CONSTRAINT "activityTasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: automationExecutions automationExecutions_automationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."automationExecutions"
    ADD CONSTRAINT "automationExecutions_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES public.automations(id) ON UPDATE CASCADE;


--
-- Name: automationExecutions automationExecutions_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."automationExecutions"
    ADD CONSTRAINT "automationExecutions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: automations automations_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT "automations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: automations automations_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT "automations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: automations automations_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.automations
    ADD CONSTRAINT "automations_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conversationSettings conversationSettings_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."conversationSettings"
    ADD CONSTRAINT "conversationSettings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conversationSettings conversationSettings_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."conversationSettings"
    ADD CONSTRAINT "conversationSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conversationSettings conversationSettings_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."conversationSettings"
    ADD CONSTRAINT "conversationSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conversations conversations_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "conversations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: conversations conversations_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "conversations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: conversations conversations_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT "conversations_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: eagleEyeContents eagleEyeContents_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."eagleEyeContents"
    ADD CONSTRAINT "eagleEyeContents_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: eagleEyeContents eagleEyeContents_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."eagleEyeContents"
    ADD CONSTRAINT "eagleEyeContents_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: eagleEyeContents eagleEyeContents_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."eagleEyeContents"
    ADD CONSTRAINT "eagleEyeContents_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: files files_belongsToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_belongsToId_fkey" FOREIGN KEY ("belongsToId") REFERENCES public.settings(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: files files_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: files files_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: files files_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.files
    ADD CONSTRAINT "files_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: integrations integrations_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT "integrations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: integrations integrations_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT "integrations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: integrations integrations_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.integrations
    ADD CONSTRAINT "integrations_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: memberActivityAggregatesMVs memberActivityAggregatesMVs_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberActivityAggregatesMVs"
    ADD CONSTRAINT "memberActivityAggregatesMVs_id_fkey" FOREIGN KEY (id) REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberAttributeSettings memberAttributeSettings_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberAttributeSettings"
    ADD CONSTRAINT "memberAttributeSettings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: memberAttributeSettings memberAttributeSettings_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberAttributeSettings"
    ADD CONSTRAINT "memberAttributeSettings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: memberAttributeSettings memberAttributeSettings_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberAttributeSettings"
    ADD CONSTRAINT "memberAttributeSettings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: memberNoMerge memberNoMerge_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberNoMerge"
    ADD CONSTRAINT "memberNoMerge_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberNoMerge memberNoMerge_noMergeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberNoMerge"
    ADD CONSTRAINT "memberNoMerge_noMergeId_fkey" FOREIGN KEY ("noMergeId") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberNotes memberNotes_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberNotes"
    ADD CONSTRAINT "memberNotes_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberNotes memberNotes_noteId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberNotes"
    ADD CONSTRAINT "memberNotes_noteId_fkey" FOREIGN KEY ("noteId") REFERENCES public.notes(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberOrganizations memberOrganizations_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberOrganizations"
    ADD CONSTRAINT "memberOrganizations_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberOrganizations memberOrganizations_organizationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberOrganizations"
    ADD CONSTRAINT "memberOrganizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES public.organizations(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberTags memberTags_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberTags"
    ADD CONSTRAINT "memberTags_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberTags memberTags_tagId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberTags"
    ADD CONSTRAINT "memberTags_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES public.tags(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberTasks memberTasks_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberTasks"
    ADD CONSTRAINT "memberTasks_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberTasks memberTasks_taskId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberTasks"
    ADD CONSTRAINT "memberTasks_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberToMerge memberToMerge_memberId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberToMerge"
    ADD CONSTRAINT "memberToMerge_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: memberToMerge memberToMerge_toMergeId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."memberToMerge"
    ADD CONSTRAINT "memberToMerge_toMergeId_fkey" FOREIGN KEY ("toMergeId") REFERENCES public.members(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: members members_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT "members_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: members members_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT "members_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: members members_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.members
    ADD CONSTRAINT "members_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: microservices microservices_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microservices
    ADD CONSTRAINT "microservices_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: microservices microservices_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microservices
    ADD CONSTRAINT "microservices_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: microservices microservices_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.microservices
    ADD CONSTRAINT "microservices_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notes notes_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "notes_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: notes notes_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "notes_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: notes notes_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT "notes_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: organizations organizations_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT "organizations_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: organizations organizations_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT "organizations_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: organizations organizations_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT "organizations_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reports reports_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "reports_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: reports reports_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "reports_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: reports reports_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT "reports_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: settings settings_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT "settings_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: settings settings_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT "settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: settings settings_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.settings
    ADD CONSTRAINT "settings_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tags tags_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT "tags_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tags tags_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT "tags_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: tags tags_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT "tags_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_assignedToId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tasks tasks_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: tasks tasks_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT "tasks_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tenantUsers tenantUsers_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."tenantUsers"
    ADD CONSTRAINT "tenantUsers_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tenantUsers tenantUsers_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."tenantUsers"
    ADD CONSTRAINT "tenantUsers_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tenantUsers tenantUsers_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."tenantUsers"
    ADD CONSTRAINT "tenantUsers_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tenantUsers tenantUsers_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."tenantUsers"
    ADD CONSTRAINT "tenantUsers_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE;


--
-- Name: tenants tenants_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT "tenants_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: tenants tenants_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tenants
    ADD CONSTRAINT "tenants_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: users users_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT "users_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: widgets widgets_createdById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT "widgets_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: widgets widgets_reportId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT "widgets_reportId_fkey" FOREIGN KEY ("reportId") REFERENCES public.reports(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: widgets widgets_tenantId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT "widgets_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES public.tenants(id) ON UPDATE CASCADE;


--
-- Name: widgets widgets_updatedById_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.widgets
    ADD CONSTRAINT "widgets_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

