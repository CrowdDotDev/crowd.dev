/* eslint-disable @typescript-eslint/no-explicit-any */

import { CustomViewPlacement, CustomViewVisibility } from './enums/customViews'

export interface IConfigStatic {
  search: string
  relation: 'and' | 'or'
  order: {
    prop: string
    order: 'descending' | 'ascending'
  }
  settings?: Record<string, any>
}

export type CustomViewConfig = IConfigStatic & Record<string, any>

export interface ICustomView {
  name: string
  config: CustomViewConfig
  visibility: CustomViewVisibility
  placement: CustomViewPlacement
}
