'use strict'

import Router from 'koa-router'
import client from './storage'

const router = new Router()

const menu = async () => {
  return {
    main: await client.getAsync('lunch:main'),
    complement: await client.getAsync('lunch:complement'),
    salad: await client.getAsync('lunch:salad'),
    dessert: await client.getAsync('lunch:dessert')
  }
}

router.get('/', async ctx => {
  await ctx.render('index', await menu())
})

router.get('/menu.json', async ctx => {
  ctx.body = await menu()
})

export default router
