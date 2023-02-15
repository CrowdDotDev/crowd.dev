import { S3_CONFIG } from "../../../../config"
import SequelizeRepository from "../../../../database/repositories/sequelizeRepository"
import UserRepository from "../../../../database/repositories/userRepository"
import getUserContext from "../../../../database/utils/getUserContext"
import EagleEyeContentService from "../../../../services/eagleEyeContentService"

async function eagleEyeEmailDigestWorker(userId: string): Promise<any> {
    // const s3Url = `https://${
    //     S3_CONFIG.microservicesAssetsBucket
    //   }-${getStage()}.s3.eu-central-1.amazonaws.com`
    const s3Url = `https://${S3_CONFIG.microservicesAssetsBucket
        }-staging.s3.eu-central-1.amazonaws.com`
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const user = await UserRepository.findById(userId, { ...options, bypassPermissionValidation: true })
    const userContext = await getUserContext(user.tenants[0].tenant.id, user.id)

    const eagleEyeContentService = new EagleEyeContentService(userContext)
    const digest = ((await eagleEyeContentService.search(true))
        .slice(0, 10))
        .map((c) => {
            (c as any).platformIcon = `${s3Url}/email/${c.platform}.png`
            return c
        })

    console.log("Digest is: ")
    console.log(digest)
    console.log("digest.length: ")
    console.log(digest.length)

    // console.log("user is: ")
    // console.log(user)
    // console.log("tenant is: ")
    // console.log(user.tenants[0].tenant.id)
    // const uc = await getUserContext(user.tenan)


}


export { eagleEyeEmailDigestWorker }
