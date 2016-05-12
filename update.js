#!/usr/bin/env node
'use strict'

import cheerio from 'cheerio'
import request from 'request'
import client from './storage'

const sanitize = words => words.toLowerCase().replace('/', ' e ').trim()

request.get('http://ru.ufsc.br/ru/', (err, res, html) => {
  if (err) {
    throw err
  }

  console.log('Parsing HTML')
  const $ = cheerio.load(html)
  console.log('HTML parsed')

  // adjust date to UTC-3, make sunday wrap around and offset header
  const weekday = (new Date().getDay() - 1) % 7 + 1

  console.log('Filtering elements')
  const cells = $(`.entry > table:first-of-type tr:nth-child(${weekday}) td:nth-child(n+4)`)
  console.log('Elements filtered')

  if (cells.length !== 4) {
    throw new Error('Failure to parse HTML')
  }

  console.log('Updating database')
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
  console.log('Finished scraping')
})
