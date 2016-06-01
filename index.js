'use strict'

import Koa from 'koa'
import favicon from 'koa-favicon'
import logger from 'koa-logger'
import serve from 'koa-static'
import views from 'koa-views'
import router from './routes'

const app = new Koa()

app.use(favicon(`${__dirname}/favicon.ico`))
app.use(serve(`${__dirname}/static`))
app.use(views(`${__dirname}`, {
  map: {
    html: 'mustache'
  }
}))

if (app.env === 'development') {
  app.use(logger('dev'))

  // development error handler
  // will print stacktrace
  app.use(async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      app.emit('error', err, ctx)

      ctx.type = 'application/json'
      ctx.status = err.status || 404
      ctx.body = {
        status: err.status >= 500 ? 'error' : 'fail',
        message: err.message
      }
    }
  })
} else {
  // production error handler
  // no stacktraces leaked to user
  app.use(async (ctx, next) => {
    try {
      await next()
    } catch (err) {
      app.emit('error', err, ctx)

      ctx.type = 'application/json'
      ctx.status = err.status || 500
      ctx.body = {
        status: err.status >= 500 ? 'error' : 'fail',
        message: '[REDACTED]'
      }
    }
  })
}

app.use(router.routes())

export default app
