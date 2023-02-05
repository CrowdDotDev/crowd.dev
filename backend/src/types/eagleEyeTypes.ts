export enum EagleEyeActionType {
    THUMBS_UP = 'thumbs-up',
    THUMBS_DOWN = 'thumbs-down',
    BOOKMARK = 'bookmark',
}


export interface EagleEyeAction {
    id?: string
    type: EagleEyeActionType
    timestamp: Date | string
    createdAt?: Date | string
    updatedAt?: Date | string
}

export interface EagleEyeContent {
    id?: string
    platform: string
    post: any
    url: string
    actions?: EagleEyeAction[]
    tenantId: string
    postedAt: string
    createdAt?: Date | string
    updatedAt?: Date | string
}

