'use strict'

import Koa from 'koa'
import favicon from 'koa-favicon'
import logger from 'koa-logger'
import serve from 'koa-static'
import views from 'koa-views'
import router from './routes'

const app = new Koa()

app.use(views(`${__dirname}/public`, {
  map: {
    html: 'mustache'
  }
}))
app.use(favicon(`${__dirname}/public/favicon.ico`))
app.use(serve(`${__dirname}/public`))

const devel = app.env === 'development'

if (devel) {
  app.use(logger('dev'))
}

app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    app.emit('error', err, ctx)

    ctx.type = 'application/json'
    ctx.status = err.status || (devel ? 404 : 500)
    ctx.body = {
      status: err.status >= 500 ? 'error' : 'fail',
      message: (devel ? err.message : '[REDACTED]')
    }
  }
})

app.use(router.routes())

export default app
