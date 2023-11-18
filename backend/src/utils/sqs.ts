// import {
//   DeleteMessageRequest,
//   Message,
//   ReceiveMessageRequest,
//   SendMessageRequest,
//   SendMessageResult,
// } from 'aws-sdk/clients/sqs'

// export const receiveMessage = async (
//   params: ReceiveMessageRequest,
// ): Promise<Message | undefined> => {
//   params.MaxNumberOfMessages = 1
//   params.WaitTimeSeconds = 15
//   params.VisibilityTimeout = 15

//   const result = await sqs.receiveMessage(params).promise()

//   if (result.Messages && result.Messages.length === 1) {
//     return result.Messages[0]
//   }

//   return undefined
// }

// export const deleteMessage = async (params: DeleteMessageRequest): Promise<void> => {
//   await sqs.deleteMessage(params).promise()
// }

// export const sendMessage = async (params: SendMessageRequest): Promise<SendMessageResult> =>
//   sqs.sendMessage(params).promise()
