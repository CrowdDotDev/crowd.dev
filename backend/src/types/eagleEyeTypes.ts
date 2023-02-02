export enum EagleEyeActionType {
    THUMBS_UP = 'thumbs-up',
    THUMBS_DOWN = 'thumbs-down',
    BOOKMARK = 'bookmark',
}

export interface EagleEyeContentData {
    id?: string
    platform: string
    post: any
    url: string
    tenantId: string
    createdAt?: string
    updatedAt?: string
}

export interface EagleEyeActionData {
    id?: string
    action: EagleEyeActionType
    timestamp: string
    content: EagleEyeContentData
    createdAt?: string
    updatedAt?: string
}
