#!/usr/bin/env node
'use strict'

import cheerio from 'cheerio'
import request from 'request'
import client from './storage'

const replMap = {
  'bife': 'chinelo',
  'quibe': 'quibe :(',
}

const regex = new RegExp(Object.keys(replMap).join('|'))
const ruify = words => words.replace(regex, match => replMap[match])
const sanitize = words => words.toLowerCase().replace('/', ' e ').trim()

request({
  gzip: true,
  uri: 'http://ru.ufsc.br/ru/',
}, (err, res, html) => {
  if (err) {
    throw err
  }

  const $ = cheerio.load(html)

  // adjust date to UTC-3, make sunday wrap around and offset header
  const weekday = (new Date().getDay() - 1) % 7 + 2
  const cells = $(`.entry > table:first-of-type tr:nth-child(${weekday}) td:nth-child(n+4)`)

  if (cells.length !== 4) {
    throw new Error('Failure to parse HTML')
  }

  client.multi()
    .set('lunch:main', sanitize(cells.eq(0).text()))
    .set('lunch:complement', sanitize(cells.eq(1).text()))
    .set('lunch:salad', sanitize(cells.eq(2).text()))
    .set('lunch:dessert', sanitize(cells.eq(3).text()))
    .exec(err => {
      if (err) {
        throw err
      }

      client.quit()
    })
})
