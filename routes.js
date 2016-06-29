'use strict'

import {PassThrough} from 'stream'
import cloudinary from 'cloudinary'
import multer from 'koa-multer'
import Router from 'koa-router'
import client from './storage'

const router = new Router()
const upload = multer()

const menu = async () => {
  const menu = await client.hgetallAsync('lunch')
  return menu
}

router.get('/', async ctx => {
  const hour = new Date().getHours() - 3 // offset for UTC-3
  await ctx.render('index', Object.assign(await menu(), {
    images: (await client.lrangeAsync('images', 0, 10)).map(JSON.parse),
    showUpload: (hour >= 11 && hour < 14) || (hour >= 17 && hour < 19)
  }))
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

  ctx.body = {
    url: payload.secure_url
  }
  await client.lpushAsync('images', JSON.stringify({
    id: payload.public_id,
    url: payload.secure_url
  }))
})

router.get('/menu.json', async ctx => {
  ctx.body = await menu()
})

export default router
