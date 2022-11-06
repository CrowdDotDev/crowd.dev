const { defineConfig } = require('cypress')
const webpackConfig = require('@vue/cli-service/webpack.config.js')
// use Nodemailer to get an Ethereal email inbox
// https://nodemailer.com/about/
const nodemailer = require('nodemailer')
// used to check the email inbox
const imaps = require('imap-simple')
// used to parse emails from the inbox
const simpleParser = require('mailparser').simpleParser

const makeEmailAccount = async () => {
  // Generate a new Ethereal email inbox account
  console.log('creating mail')
  const testAccount = await new Promise(
    (resolve, reject) => {
      console.log('mailer')
      nodemailer.createTestAccount((err, account) => {
        console.log('test', err, reject)
        if (err) {
          reject(err)
        }
        resolve(account)
      })
    }
  )

  console.log(testAccount)

  const emailConfig = {
    imap: {
      user: testAccount.user,
      password: testAccount.pass,
      host: 'imap.ethereal.email',
      port: 993,
      tls: true,
      authTimeout: 10000
    }
  }
  console.log(
    'created new email account %s',
    testAccount.user
  )
  console.log(
    'for debugging, the password is %s',
    testAccount.pass
  )

  return {
    email: testAccount.user,

    /**
     * Utility method for getting the last email
     * for the Ethereal email account created above.
     */
    async getLastEmail() {
      // makes debugging very simple
      console.log('getting the last email')
      console.log(emailConfig)

      try {
        const connection = await imaps.connect(emailConfig)

        // grab up to 50 emails from the inbox
        await connection.openBox('INBOX')
        const searchCriteria = ['1:50']
        const fetchOptions = {
          bodies: ['']
        }
        const messages = await connection.search(
          searchCriteria,
          fetchOptions
        )
        // and close the connection to avoid it hanging
        connection.end()

        if (!messages.length) {
          console.log('cannot find any emails')
          return null
        } else {
          console.log(
            'there are %d messages',
            messages.length
          )
          // grab the last email
          const mail = await simpleParser(
            messages[messages.length - 1].parts[0].body
          )
          console.log(mail.subject)
          console.log(mail.text)

          // and returns the main fields
          return {
            subject: mail.subject,
            text: mail.text,
            html: mail.html
          }
        }
      } catch (e) {
        console.error(e)
        return null
      }
    }
  }
}

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8081',
    specPattern: 'tests/e2e/*.spec.js',
    supportFile: 'tests/support/index.js',
    setupNodeEvents(on) {
      on('task', {
        getEmailAccount() {
          return new Promise((resolve) => {
            const account = makeEmailAccount()
            resolve(account)
          })
        }
      })
    }
  },
  folders: {
    fixturesFolder: 'tests/fixtures',
    screenshotsFolder: 'tests/screenshots',
    videosFolder: 'tests/videos'
  },
  component: {
    devServer: {
      framework: 'vue',
      bundler: 'webpack',
      webpackConfig
    }
  },
  browser: {
    chromeWebSecurity: false
  },
  env: {
    apiUrl: 'http://localhost:8080'
  }
})
