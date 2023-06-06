import { API_CONFIG } from '../conf'

const express = require('express')
const fs = require('fs')
const path = require('path')

export default function setupSwaggerUI(app) {
  if (API_CONFIG.documentation) {
    return
  }

  const serveSwaggerDef = function serveSwaggerDef(req, res) {
    res.sendFile(path.resolve(`${__dirname}/../documentation/openapi.json`))
  }
  app.get('/documentation-config', serveSwaggerDef)

  const swaggerUiAssetPath = require('swagger-ui-dist').getAbsoluteFSPath()
  const swaggerFiles = express.static(swaggerUiAssetPath)

  const urlRegex = /url: "[^"]*",/

  const patchIndex = function patchIndex(req, res) {
    const indexContent = fs
      .readFileSync(`${swaggerUiAssetPath}/index.html`)
      .toString()
      .replace(urlRegex, 'url: "../documentation-config",')
    res.send(indexContent)
  }

  app.get('/documentation', (req, res) => {
    let targetUrl = req.originalUrl
    if (!targetUrl.endsWith('/')) {
      targetUrl += '/'
    }
    targetUrl += 'index.html'
    res.redirect(targetUrl)
  })
  app.get('/documentation/index.html', patchIndex)

  app.use('/documentation', swaggerFiles)
}
