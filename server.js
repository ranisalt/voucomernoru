#! /usr/bin/env node --harmony
'use strict'

/**
 * Module dependencies.
 */

const http = require('http')
const debug = require('debug')
const app = require('./app')

/**
 * Get port from environment.
 */

const port = (() => {
  /**
   * Normalize a port into a number, string, or false.
   */

  const port = parseInt(process.env.PORT || 3000, 10)

  if (isNaN(port)) {
    // named pipe
    return process.env.PORT
  } else if (port >= 0) {
    // port number
    return port
  }
  return false
})()

/**
 * Create HTTP server.
 */

const server = http.createServer(app.callback())

/**
 * Event listener for HTTP server "error" event.
 */

const onError = error => {
  if (error.syscall !== 'listen') {
    throw error
  }

  const bind = typeof port === 'string' ? `Pipe ${port}` : `Port ${port}`

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES': {
      console.error(`${bind} requires elevated privileges`)
      process.exit(1)
    }
    case 'EADDRINUSE': {
      console.error(`${bind} is already in use`)
      process.exit(1)
    }
    default: {
      throw error
    }
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

const onListening = () => {
  const addr = server.address()
  const bind = typeof addr === 'string' ? `pipe ${addr}` : `port ${addr.port}`
  debug('tickt:server')(`Listening on ${bind}`)
}

/**
 * Listen on provided port, on all network interfaces.
 */

server.listen(port)
server.on('error', onError)
server.on('listening', onListening)
