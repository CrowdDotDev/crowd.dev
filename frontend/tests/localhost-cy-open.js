const concurrently = require('concurrently')

const { result } = concurrently(
  [
    {
      command:
        'npx wait-on http://localhost:8081 && npx cypress open',
      name: 'Cypress'
    }
  ],
  {
    prefix: 'name',
    killOthers: ['failure', 'success']
  }
)

result.then(
  function onSuccess() {
    // This code is necessary to make sure the parent terminates
    // when the application is closed successfully.

    process.exit()
  },
  function onFailure() {
    // This code is necessary to make sure the parent terminates
    // when the application is closed because of a failure.

    process.exit()
  }
)
