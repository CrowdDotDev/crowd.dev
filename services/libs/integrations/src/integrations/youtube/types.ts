// types.ts content
export enum YoutubeActivityType {
  COMMENT = 'comment',
}

export enum YoutubeRootStream {
  UPLOADED_VIDEOS = 'uploaded_videos',
  CHANNEL_VIDEO = 'channel_video',
  KEYWORDS_SEARCH = 'keywords_search' 
}

export interface YoutubeIntegrationSettings {
  apiKey: string
  uploadPlaylistId: string
  channelId: string
  nextPageToken?: string
  keywords?: string[]
} 

export interface YoutubeVideoStreamConfig {
  videoId: string
  apiKey: string
  title: string
  nextPageToken?: string
} 

export interface YoutubeVideoSearch {
    kind: string
    etag: string
    nextPageToken: string
    regionCode: string
    pageInfo: {
        totalResults: number
        resultsPerPage: number
    }
    items: YoutubeChannelSearchItem[]
}

interface YoutubeChannelSearchItem {
    kind: string
    etag: string
    id: {
        kind: string
        videoId: string
    },
    snippet: {
        publishedAt: string
        channelId: string
        title: string
        description: string
        thumbnails: {
            default: YoutubeThumbnail
            medium: YoutubeThumbnail
            high: YoutubeThumbnail
        },
        channelTitle: string
        liveBroadcastContent: string
    }
}

interface YoutubeThumbnail {
    url: string
    width: number
    height: number
}


export interface YoutubeCommentThreadSearch {
    kind: string
    etag: string
    nextPageToken: string
    pageInfo: {
        totalResults: number
        resultsPerPage: number
    },
    items: YoutubeCommentThread[]
}

export interface YoutubeCommentThread {
    kind: string
    etag: string
    id: string
    snippet: {
        channelId?: string
        videoId: string
        topLevelComment: YoutubeComment
    },
    canReply: boolean
    totalReplyCount: number
    isPublic: boolean
}

export interface YoutubeComment {
    kind: string
    etag: string
    id: string
    snippet: {
        authorDisplayName: string
        authorProfileImageUrl: string
        authorChannelUrl: string
        authorChannelId: {
            value: string
        },
        channelId?: string
        videoId: string
        textDisplay: string
        textOriginal: string
        canRate: boolean
        viewerRating: string
        likeCount: number
        publishedAt: string
        updatedAt: string
    }
}
