import { Request, Response, Router } from 'express'
import { Gauge, Registry } from 'prom-client'

import { Logger } from '@crowd/logging'

const KAFKA_CONNECT_URL = 'http://localhost:8083'

// All possible Kafka Connect states
const CONNECTOR_STATES = ['RUNNING', 'FAILED', 'PAUSED', 'UNASSIGNED'] as const
const TASK_STATES = ['RUNNING', 'FAILED', 'PAUSED', 'UNASSIGNED'] as const

interface ConnectorTask {
  id: number
  state: string
  worker_id: string
}

interface ConnectorStatus {
  name: string
  connector: {
    state: string
    worker_id: string
  }
  tasks: ConnectorTask[]
  type: string
}

interface ConnectorsResponse {
  [connectorName: string]: {
    status: ConnectorStatus
  }
}

export function installConnectorHealthRoutes(app: Router, log: Logger): void {
  app.get('/connector-health', async (req: Request, res: Response) => {
    try {
      // Create a new registry for this request
      const register = new Registry()

      // Fetch connector statuses from Kafka Connect
      const connectorsUrl = `${KAFKA_CONNECT_URL}/connectors?expand=status`
      const response = await fetch(connectorsUrl)

      if (!response.ok) {
        log.error(
          { status: response.status, statusText: response.statusText },
          'Failed to fetch connector status from Kafka Connect',
        )
        res.status(500).json({
          error: 'Failed to fetch connector status from Kafka Connect',
          status: response.status,
        })
        return
      }

      const data = (await response.json()) as ConnectorsResponse

      // Create gauges for connector status (one-hot encoding per state)
      const connectorStatusGauge = new Gauge({
        name: 'connector_status',
        help: 'Connector status (one-hot: 1 for active state, 0 otherwise)',
        labelNames: ['connector', 'worker_id', 'state'],
        registers: [register],
      })

      // Create gauges for task status (one-hot encoding per state)
      const taskStatusGauge = new Gauge({
        name: 'task_status',
        help: 'Task status (one-hot: 1 for active state, 0 otherwise)',
        labelNames: ['connector', 'task_id', 'worker_id', 'state'],
        registers: [register],
      })

      // Process each connector
      for (const connectorData of Object.values(data)) {
        const status = connectorData.status

        // Set connector status metric (one-hot: 1 for current state, 0 for all others)
        for (const state of CONNECTOR_STATES) {
          connectorStatusGauge.set(
            {
              connector: status.name,
              worker_id: status.connector.worker_id,
              state,
            },
            status.connector.state === state ? 1 : 0,
          )
        }

        // Set task status metrics (one-hot: 1 for current state, 0 for all others)
        for (const task of status.tasks) {
          for (const state of TASK_STATES) {
            taskStatusGauge.set(
              {
                connector: status.name,
                task_id: task.id.toString(),
                worker_id: task.worker_id,
                state,
              },
              task.state === state ? 1 : 0,
            )
          }
        }
      }

      // Return metrics in Prometheus format
      res.set('Content-Type', register.contentType)
      res.send(await register.metrics())
    } catch (err) {
      log.error(err, 'Error fetching connector health')
      res.status(500).json({ error: 'Internal server error' })
    }
  })
}
