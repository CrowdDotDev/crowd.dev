import jwt, { JsonWebTokenError } from 'jsonwebtoken'
import cubejs from '@cubejs-client/core'
import { Error400 } from '@crowd/common'

export class CubeJsService {
  private tenantId: string

  private segments: string[]

  token: string

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  api: any

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  meta: any

  /**
   * Sets tenant security context for cubejs api.
   * Also initializes cubejs api object from security context.
   * @param tenantId
   * @param segments
   */
  async init(tenantId: string, segments: string[]): Promise<void> {
    this.tenantId = tenantId
    this.segments = segments
    this.token = await CubeJsService.generateJwtToken(this.tenantId, this.segments)
    this.api = cubejs(this.token, { apiUrl: process.env['CROWD_CUBEJS_URL'] })
  }

  /**
   * Loads the result data for a given cubejs query
   * @param query
   * @returns
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async load(query: any): Promise<any> {
    const result = await this.api.load(query)
    return result.loadResponses[0].data
  }

  static async generateJwtToken(tenantId: string, segments: string[]) {
    const context = { tenantId, segments }
    const token = jwt.sign(context, process.env['CROWD_CUBEJS_JWT_SECRET'], {
      expiresIn: process.env['CROWD_CUBEJS_JWT_EXPIRY'],
    })

    return token
  }

  static async verifyToken(language, token, tenantId) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const decodedToken: any = jwt.verify(token, process.env['CROWD_CUBEJS_JWT_SECRET'])

      if (decodedToken.tenantId !== tenantId) {
        throw new Error400(language, 'cubejs.tenantIdNotMatching')
      }
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new Error400(language, 'cubejs.invalidToken')
      }

      throw error
    }
  }
}
