import { getAndSendNextEmails as eagleeyeGetAndSendNextEmails } from './workflows/eagleye-digest/getAndSendNextEmails'
import { sendEmailAndUpdateHistory as eagleeyeSendEmailAndUpdateHistory } from './workflows/eagleye-digest/sendEmailAndUpdateHistory'

import { getAndSendNextEmails as weeklyGetAndSendNextEmails } from './workflows/weekly-analytics/getAndSendNextEmails'
import { sendEmailAndUpdateHistory as weeklySendEmailAndUpdateHistory } from './workflows/weekly-analytics/sendEmailAndUpdateHistory'

export {
  eagleeyeGetAndSendNextEmails,
  eagleeyeSendEmailAndUpdateHistory,
  weeklyGetAndSendNextEmails,
  weeklySendEmailAndUpdateHistory,
}
