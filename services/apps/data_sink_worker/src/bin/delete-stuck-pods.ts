import { exec } from 'child_process'

const getPods = async (): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    exec('kubectl get pods -n platform', (err, stdout) => {
      if (err) {
        reject(err)
      } else {
        const lines = stdout.split('\n')
        resolve(lines)
      }
    })
  })
}

const executeCommand = async (command: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    exec(command, (err, stdout) => {
      if (err) {
        reject(err)
      } else {
        const lines = stdout.split('\n')
        resolve(lines)
      }
    })
  })
}

setImmediate(async () => {
  const lines = await getPods()
  for (const line of lines) {
    const split = line.split(' ').filter((x) => x.trim().length > 0)
    const pod = split[0]
    const state = split[2]
    if (
      state === 'Evicted' ||
      state === 'OOMKilled' ||
      state === 'ContainerStatusUnknown' ||
      state === 'Error'
    ) {
      const command = `kubectl delete pod ${pod} --force --grace-period=0  -n platform`
      const result = await executeCommand(command)
      console.log(result)
    }
  }
})
