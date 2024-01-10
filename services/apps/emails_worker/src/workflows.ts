import { eagleeyeGetAndSendNextEmails } from './workflows/eagleye-digest/getAndSendNextEmails'
import { eagleeyeSendEmailAndUpdateHistory } from './workflows/eagleye-digest/sendEmailAndUpdateHistory'

import { weeklyGetAndSendNextEmails } from './workflows/weekly-analytics/getAndSendNextEmails'
import { weeklySendEmailAndUpdateHistory } from './workflows/weekly-analytics/sendEmailAndUpdateHistory'

export {
  eagleeyeGetAndSendNextEmails,
  eagleeyeSendEmailAndUpdateHistory,
  weeklyGetAndSendNextEmails,
  weeklySendEmailAndUpdateHistory,
}
