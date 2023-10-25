import { getNextEmails } from './activities/getNextEmails'
import { updateNextEmailAt, updateEmailHistory } from './activities/updateEmailHistory'
import {
  sendEmail,
  buildEmailContent,
  fetchFromDatabase,
  fetchFromEagleEye,
} from './activities/buildAndSendEmail'

export {
  getNextEmails,
  buildEmailContent,
  updateNextEmailAt,
  updateEmailHistory,
  sendEmail,
  fetchFromDatabase,
  fetchFromEagleEye,
}
