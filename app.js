'use strict'

const PassThrough = require('stream').PassThrough
const Koa = require('koa')
const cloudinary = require('cloudinary')
const favicon = require('koa-favicon')
const logger = require('koa-logger')
const MongoClient = require('easymongo')
const multer = require('koa-multer')
const nunjucks = require('nunjucks')
const Router = require('koa-router')
const serve = require('koa-static')
const update = require('./update')

nunjucks.configure('templates')
const render = function (...args) {
  return new Promise((resolve, reject) => {
    return nunjucks.render(...args, (err, res) => {
      if (err) {
        reject(err)
      }
      resolve(res)
    })
  })
}

const app = new Koa()

app.use(favicon(`${__dirname}/favicon.ico`))
app.use(serve(`${__dirname}/public`))

const devel = app.env === 'development'

if (devel) {
  app.use(logger('dev'))
}

const client = new MongoClient(process.env.MONGODB_URI)
const db = client.collection('ru')

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

const router = new Router()
const upload = multer()

function today () {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  return date
}

async function fetchMenu () {
  const date = today()
  const menu = await db.findOne({date})

  if (!menu) {
    return update.ru(db, date)
  } else {
    return menu
  }
}

router.get('/', async ctx => {
  const hour = new Date().getHours() - 3 // offset for UTC-3

  const menu = await fetchMenu()
  // menu.showUpload = (hour >= 11 && hour < 14) || (hour >= 17 && hour < 19)
  ctx.body = await render('ru.njk', menu)
})

// router.get('/cca', async ctx => {
//   ctx.body = await render('cca.njk', {options: await client.lrangeAsync('cca', 1, -1)})
// })

router.post('/upload', upload.single('image'), async ctx => {
  const payload = await new Promise(resolve => {
    const upload = cloudinary.uploader.upload_stream(resolve, {
      crop: 'limit',
      format: 'jpg',
      height: 1000,
      width: 1000
    })
    const stream = new PassThrough()
    stream.end(ctx.req.file.buffer)
    stream.pipe(upload)
  })

  if (payload.error) {
    throw new Error('Not found')
  }

  ctx.body = {url: payload.secure_url}
  await client.saddAsync('images', JSON.stringify({
    id: payload.public_id,
    url: payload.secure_url
  }))
})

router.get('/menu.json', async ctx => {
  ctx.body = await fetchMenu()
})

app.use(router.routes()).use(router.allowedMethods())

module.exports = app
