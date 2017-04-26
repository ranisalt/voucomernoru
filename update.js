'use strict'

const cheerio = require('cheerio')
const cloudinary = require('cloudinary')
const request = require('request-promise')

const sanitize = words => words.toLowerCase().replace('/', ' e ').trim()

exports.ru = async function ru (db, date) {
  const $ = await request({
    gzip: true,
    transform: cheerio.load,
    uri: 'http://ru.ufsc.br/ru/'
  })
  // adjust date to UTC-3, make sunday wrap around and offset header
  const weekday = ((new Date().getDay() - 1) % 7) + 2
  const cells = $(`.content table:first-of-type tr:nth-child(${weekday}) td:nth-child(n+4)`)

  if (cells.length !== 4) {
    throw new Error('Failure to parse HTML')
  }

  const data = {
    date,
    main: sanitize(cells.eq(0).text()),
    complement: sanitize(cells.eq(1).text()),
    salad: sanitize(cells.eq(2).text()),
    dessert: sanitize(cells.eq(3).text())
  }

  if (await db.findOne({date})) {
    return db.update({date}, data)
  } else {
    return db.save(data)
  }
}
