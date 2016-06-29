#!/usr/bin/env node
'use strict'

import cheerio from 'cheerio'
import cloudinary from 'cloudinary'
import request from 'request-promise'
import client from './storage'

(async () => {
  const replMap = {
    'bife': 'chinelo',
    'quibe': 'quibe :('
  }

  const regex = new RegExp(Object.keys(replMap).join('|'))
  const ruify = words => words.replace(regex, match => replMap[match])
  const sanitize = words => words.toLowerCase().replace('/', ' e ').trim()

  const $ = await request({
    gzip: true,
    transform: cheerio.load,
    uri: 'http://ru.ufsc.br/ru/'
  })
  // adjust date to UTC-3, make sunday wrap around and offset header
  const weekday = (new Date().getDay() - 1) % 7 + 2
  const cells = $(`.entry > table:first-of-type tr:nth-child(${weekday}) td:nth-child(n+4)`)

  if (cells.length !== 4) {
    throw new Error('Failure to parse HTML')
  }

  await client.multi()
    .hmset('lunch', [
      'main', ruify(sanitize(cells.eq(0).text())),
      'complement', sanitize(cells.eq(1).text()),
      'salad', sanitize(cells.eq(2).text()),
      'dessert', sanitize(cells.eq(3).text())
    ])
    .execAsync()

  const images = await client.lrangeAsync('images', 0, -1).map(JSON.parse)
  images.forEach(image => {
    cloudinary.uploader.destroy(image.id)
  })

  await client.delAsync('images')
  await client.quitAsync()
})()
