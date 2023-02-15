import SequelizeRepository from "../../../../database/repositories/sequelizeRepository"
import UserRepository from "../../../../database/repositories/userRepository"
import getUserContext from "../../../../database/utils/getUserContext"
import EagleEyeContentService from "../../../../services/eagleEyeContentService"

async function eagleEyeEmailDigestWorker(userId: string): Promise<any> {
    
    const options = await SequelizeRepository.getDefaultIRepositoryOptions()
    const user = await UserRepository.findById(userId, {...options, bypassPermissionValidation: true})
    const userContext = await getUserContext(user.tenants[0].tenant.id, user.id)

    const eagleEyeContentService = new EagleEyeContentService(userContext)
    const digest = (await eagleEyeContentService.search(true)).slice()
    
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
