import { getServiceLogger } from '@crowd/logging'
import { timeout } from '@crowd/common'
import server from '../main'
import { API_CONFIG } from '../conf'

const PORT = API_CONFIG.port || 8082

const log = getServiceLogger()

server.listen(PORT, () => {
  log.info(`Listening on port ${PORT}`)
})

process.on('SIGTERM', async () => {
  log.warn('Detected SIGTERM signal, started exiting!')
  await new Promise<void>((resolve) => {
    server.close((err) => {
      if (err) {
        log.error(err, 'Error while closing server!')
        resolve()
      } else {
        log.info('Server closed successfully!')
        resolve()
      }
    })
  })

  log.info('Exiting in 5 seconds...')
  await timeout(5000)
  process.exit(0)
})
