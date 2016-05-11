'use strict'

import Router from 'koa-router'
import client from './storage'

const router = new Router()

router.get('/', async (ctx, /*next*/) => {
  const menu = {
    main: await client.getAsync('lunch:main'),
    complement: await client.getAsync('lunch:complement'),
    salad: await client.getAsync('lunch:salad'),
    dessert: await client.getAsync('lunch:dessert')
  }

  await ctx.render('index', menu)
})

export default router
