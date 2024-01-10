/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */

export enum DiscourseActivityType {
  CREATE_TOPIC = 'create_topic',
  MESSAGE_IN_TOPIC = 'message_in_topic',
  JOIN = 'join',
  LIKE = 'like',
}

export enum DiscourseStreamType {
  CATEGORIES = 'categories',
  TOPICS_FROM_CATEGORY = 'topicsFromCategory',
  POSTS_FROM_TOPIC = 'postsFromTopic',
  POSTS_BY_IDS = 'postsByIds',
}

export enum DiscourseWebhookType {
  POST_CREATED = 'post_created',
  USER_CREATED = 'user_created',
  LIKED_A_POST = 'notification_created',
}

export interface DiscourseCategoryStreamData {
  page: string
}

export interface DiscourseTopicsFromCategoryStreamData {
  category_id: number
  category_slug: string
  page: number
}

export interface DiscoursePostsFromTopicStreamData {
  topicId: number
  topic_slug: string
  page: number
}

export interface DiscoursePostsByIdsStreamData {
  topicId: number
  topicSlug: string
  topicTitle: string
  postIds: number[]
  lastIdInPreviousBatch: number | undefined
}

export enum DiscourseDataType {
  POST = 'post',
  USER_WEBHOOK = 'user_webhook',
  NOTIFICATION_WEBHOOK = 'notification_webhook',
}

export interface DiscoursePublishData {
  type: DiscourseDataType
}

export interface DiscoursePublishPostData extends DiscoursePublishData {
  type: DiscourseDataType.POST
  post: Post
  user: DiscourseUserResponse
  topicId: number
  topicSlug: string
  topicTitle: string
  lastIdInPreviousBatch?: number | undefined
}

export interface DiscoursePublishNotificationWebhookData extends DiscoursePublishData {
  type: DiscourseDataType.NOTIFICATION_WEBHOOK
  user: DiscourseUserResponse
  notification: DiscourseWebhookNotification['notification']
  channel: string
}

export interface DiscoursePublishUserWebhookData extends DiscoursePublishData {
  type: DiscourseDataType.USER_WEBHOOK
  user: DiscourseWebhookUser['user']
}

export interface DiscourseProcessResult {
  type: DiscourseStreamType
  data:
    | DiscourseCategoryResponse
    | DiscourseTopicResponse
    | DiscoursePostsFromTopicResponse
    | DiscoursePostsByIdsResponse
}

export interface DiscourseConnectionParams {
  apiKey: string
  apiUsername: string
  forumHostname: string
}

export interface DiscourseWebhookStreamData {
  event: DiscourseWebhookType
  data:
    | DiscourseWebhookPost
    | DiscourseWebhookUser
    | DiscourseWebhookNotification
    | DiscourseWebhookTopic
}

export interface DiscourseCategoryResponse {
  category_list: {
    can_create_category: boolean
    can_create_topic: boolean
    categories: DiscourseCategory[]
  }
}

export interface DiscourseTopicsInput {
  category_slug: string
  category_id: number
  page: number
}

export interface DiscoursePostsInput {
  topic_slug: string
  topic_id: number
  page: number
}

export interface DisourseUserByUsernameInput {
  username: string
}

export interface DiscoursePostsByIdsInput {
  topic_id: number
  post_ids: number[]
}

export interface DiscoursePostsByIdsResponse {
  post_stream: {
    posts: Post[]
  }
  id: number // this is the id of the topic
}

export interface DiscourseWebhookPost {
  post: Post
}

export interface DiscourseWebhookNotification {
  notification: {
    id: number
    user_id: number
    notification_type: number
    read: boolean
    created_at: string
    post_number: number
    topic_id: number
    slug: string
    fancy_title?: string
    data: {
      group_id: number
      group_name: string
      inbox_count: number
      username?: string
      topic_title?: string
      original_post_id?: number
      original_post_type?: number
      original_username?: string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      revision_number: any
      display_username?: string
    }
  }
}

export interface DiscourseWebhookUser {
  user: {
    id: number
    username: string
    name: string
    avatar_template: string
    email: string
    secondary_emails: any
    last_posted_at: any
    last_seen_at: string
    created_at: string
    muted: boolean
    trust_level: number
    moderator: boolean
    admin: boolean
    title: any
    badge_count: number
    time_read: number
    recent_time_read: number
    primary_group_id: any
    primary_group_name: any
    primary_group_flair_url: any
    primary_group_flair_bg_color: any
    primary_group_flair_color: any
    featured_topic: any
    staged: boolean
    pending_count: number
    profile_view_count: number
    second_factor_enabled: boolean
    can_upload_profile_header: boolean
    can_upload_user_card_background: boolean
    post_count: number
    locale: any
    muted_category_ids: any
    regular_category_ids: any
    watched_tags: any
    watching_first_post_tags: any
    tracked_tags: any
    muted_tags: any
    tracked_category_ids: any
    watched_category_ids: any
    watched_first_post_category_ids: any
    system_avatar_template: string
    muted_usernames: any
    ignored_usernames: any
    allowed_pm_usernames: any
    mailing_list_posts_per_day: number
    featured_user_badge_ids: any
    invited_by: any
    groups: any
    user_option: any
  }
}

interface CreatedByLastPoster {
  id: number
  username: string
  name: string
  avatar_template: string
}

export interface DiscourseWebhookTopic {
  id: number
  title: string
  fancy_title: string
  posts_count: number
  created_at: string
  views: number
  reply_count: number
  like_count: number
  last_posted_at: string
  visible: boolean
  closed: boolean
  archived: boolean
  archetype: string
  slug: string
  category_id: number
  word_count: number
  deleted_at: null
  user_id: number
  featured_link: string
  pinned_globally: boolean
  pinned_at: string
  pinned_until: string
  unpinned: string
  pinned: boolean
  highest_post_number: number
  deleted_by: any
  has_deleted: boolean
  bookmarked: boolean
  participant_count: number
  thumbnails: any
  created_by: CreatedByLastPoster
  last_poster: CreatedByLastPoster
}

export interface DiscourseCategory {
  id: number
  name: string
  color: string
  text_color: string
  slug: string
  topic_count: number
  post_count: number
  position: number
  description: string
  description_text: string
  description_excerpt: string
  topic_url: string
  read_restricted: boolean
  permission: number
  notification_level: number
  can_edit: boolean
  topic_template: string
  has_children: boolean
  sort_order: string
  sort_ascending: string
  show_subcategory_list: boolean
  num_featured_topics: number
  default_view: string
  subcategory_list_style: string
  default_top_period: string
  default_list_filter: string
  minimum_required_tags: number
  navigate_to_first_post_after_read: boolean
  topics_day: number
  topics_week: number
  topics_month: number
  topics_year: number
  topics_all_time: number
  is_uncategorized: boolean
  subcategory_ids: (number | null)[]
  subcategory_list: any[]
  uploaded_logo: string
  uploaded_logo_dark: string
  uploaded_background: string
}

export interface DiscourseTopicResponse {
  users: User[]
  primary_groups: any[]
  topic_list: {
    can_create_topic: boolean
    per_page: number
    top_tags: any[]
    topics: Topic[]
  }
}

export interface DiscourseUserResponse {
  user_badges: any[]
  badges: any[]
  badge_types: any[]
  users: FullUser[]
  user: FullUser
}

export interface FullUser {
  id: number
  username: string
  name: string
  avatar_template: string
  email?: string
  bio_cooked?: string
  bio_excerpt?: string
  bio_raw?: string
  location?: string
  website?: string
  secondary_emails: string[] | null[]
  active: boolean
  admin: boolean
  moderator: boolean
  last_seen_at: string
  last_emailed_at: string
  created_at: string
  last_seen_age: number
  last_emailed_age: number
  created_at_age: number
  trust_level: number
  manual_locked_trust_level: string | null
  flag_level: number
  title: string | null
  time_read: number
  staged: boolean
  days_visited: number
  posts_read_count: number
  topics_entered: number
  post_count: number
}

interface User {
  id: number
  username: string
  name: string
  avatar_template: string
}

interface Topic {
  id: number
  title: string
  fancy_title: string
  slug: string
  posts_count: number
  reply_count: number
  highest_post_number: number
  image_url: string
  created_at: string
  last_posted_at: string
  bumped: boolean
  bumped_at: string
  archetype: string
  unseen: boolean
  pinned: boolean
  unpinned: string | null
  excerpt: string
  visible: boolean
  closed: boolean
  archived: boolean
  bookmarked: string | null
  liked: string | null
  views: number
  like_count: number
  has_summary: boolean
  last_poster_username: string
  category_id: number
  pinned_globally: boolean
  featured_link: string
  posters: Poster[]
}

interface Poster {
  extras: string | null
  description: string
  user_id: number
  primary_group_id: string | null
}

export interface DiscoursePostsFromTopicResponse {
  post_stream: {
    posts: Post[]
    stream: number[]
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  timeline_lookup: any[]
  suggested_topics: SuggestedTopic[]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tags: any[]
  tags_descriptions: {}
  id: number
  title: string
  fancy_title: string
  posts_count: number
  created_at: string
  views: number
  reply_count: number
  like_count: number
  last_posted_at: string
  visible: boolean
  closed: boolean
  archived: boolean
  has_summary: boolean
  archetype: string
  slug: string
  category_id: number
  word_count: number
  deleted_at: string
  user_id: number
  featured_link: string
  pinned_globally: boolean
  pinned_at: string
  pinned_until: string
  image_url: string
  slow_mode_seconds: number
  draft: string
  draft_key: string
  draft_sequence: number
  unpinned: string | null
  pinned: boolean
  current_post_number: number
  highest_post_number: number
  deleted_by: string | null
  has_deleted: boolean
  actions_summary: ActionSummary[]
  chunk_size: number
  bookmarked: boolean
  bookmarks: any[]
  topic_timer: string | null
  message_bus_last_id: number
  participant_count: number
  show_read_indicator: boolean
  thumbnails: string | null
  slow_mode_enabled_until: string | null
  details: TopicDetails
}

interface Post {
  id: number // this id is unique accrss all posts
  name: string
  username: string
  avatar_template: string
  created_at: string
  cooked: string
  post_number: number // this shows the order of the post in the topic, 1 is the first post
  post_type: number
  updated_at: string
  reply_count: number
  reply_to_post_number: string | null
  quote_count: number
  incoming_link_count: number
  reads: number
  readers_count: number
  score: number
  yours: boolean
  topic_id: number
  topic_slug: string
  topic_title?: string
  display_username: string
  primary_group_name: string
  flair_name: string
  flair_url: string
  flair_bg_color: string
  flair_color: string
  version: number
  can_edit: boolean
  can_delete: boolean
  can_recover: boolean
  can_wiki: boolean
  link_counts: LinkCount[]
  read: boolean
  user_title: string
  bookmarked: boolean
  actions_summary: ActionSummary[]
  moderator: boolean
  admin: boolean
  staff: boolean
  user_id: number
  hidden: boolean
  trust_level: number
  deleted_at: string | null
  user_deleted: boolean
  edit_reason: string | null
  can_view_edit_history: boolean
  wiki: boolean
  reviewable_id: number
  reviewable_score_count: number
  reviewable_score_pending_count: number
}

interface LinkCount {
  url: string
  internal: boolean
  reflection: boolean
  title: string
  clicks: number
}

interface ActionSummary {
  id: number
  can_act: boolean
  count?: number
  hidden?: boolean
}

interface SuggestedTopic extends Omit<Topic, 'posters'> {
  tags: any[]
  posters: SuggestedTopicPoster[]
}

interface SuggestedTopicPoster {
  extras: string | null
  description: string
  user: User
}

interface TopicDetails {
  can_edit: boolean
  notification_level: number
  can_move_posts: boolean
  can_delete: boolean
  can_remove_allowed_users: boolean
  can_create_post: boolean
  can_reply_as_new_topic: boolean
  can_invite_to: boolean
  can_invite_via_email: boolean
  can_flag_topic: boolean
  can_convert_topic: boolean
  can_review_topic: boolean
  can_close_topic: boolean
  can_archive_topic: boolean
  can_split_merge_topic: boolean
  can_edit_staff_notes: boolean
  can_toggle_topic_visibility: boolean
  can_pin_unpin_topic: boolean
  can_moderate_category: boolean
  can_remove_self_id: number
  participants: Participant[]
  created_by: User
  last_poster: User
}

interface Participant extends User {
  post_count: number
  primary_group_name: string
  flair_name: string
  flair_url: string
  flair_color: string
  flair_bg_color: string
  admin: boolean
  moderator: boolean
  trust_level: number
}
