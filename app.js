'use strict'

const PassThrough = require('stream').PassThrough
const Koa = require('koa')
const bluebird = require('bluebird')
const cloudinary = require('cloudinary')
const favicon = require('koa-favicon')
const logger = require('koa-logger')
const multer = require('koa-multer')
const nunjucks = require('nunjucks')
const Router = require('koa-router')
const serve = require('koa-static')
const client = require('./storage')

nunjucks.configure('templates')
const render = bluebird.promisify(nunjucks.render)

const app = new Koa()

app.use(favicon(`${__dirname}/favicon.ico`))
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

const router = new Router()
const upload = multer()

const fetchMenu = async () => {
  const stuff = await client.hgetallAsync('lunch')
  stuff.juice = Number(await client.getAsync('juice')) > 0
  return stuff
}

router.get('/', async ctx => {
  const hour = new Date().getHours() - 3 // offset for UTC-3

  const menu = await fetchMenu()
  menu.images = (await client.smembersAsync('images')).map(JSON.parse)
  menu.showUpload = (hour >= 11 && hour < 14) || (hour >= 17 && hour < 19)
  ctx.body = await render('ru.njk', menu)
})

router.get('/cca', async ctx => {
  ctx.body = await render('cca.njk', {options: await client.lrangeAsync('cca', 1, -1)})
})

router.post('/juice', upload.single('juice'), async ctx => {
  if (ctx.req.body.juice === 'true') {
    ctx.body = {count: await client.incrAsync('juice')}
  } else {
    ctx.body = {count: await client.decrAsync('juice')}
  }
})

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
