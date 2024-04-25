export default async (req, res) => {

  return req.responseHandler.success(req, res, { message: "ok" })
}
