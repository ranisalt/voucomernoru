'use strict'

const bluebird = require('bluebird')
const cheerio = require('cheerio')
const cloudinary = require('cloudinary')
const pdf2table = require('pdf2table')
const request = require('request-promise')

// const ccaIgnores = new Set([
//   'saladas', 'acompanhamentos quentes', 'carnes', 'sobremesa'
// ])
const replMap = {
  bife: 'chinelo',
  quibe: 'quibe :('
}

const regex = new RegExp(Object.keys(replMap).join('|'))
const ruify = words => words.replace(regex, match => replMap[match])
const sanitize = words => words.toLowerCase().replace('/', ' e ').trim()
bluebird.promisifyAll(pdf2table)

// const cca = async () => {
//   const weekday = (new Date().getDay()) % 7

//   // you'll get nothing from me on weekends!
//   if (weekday === 0 || weekday === 6) {
//     return
//   }

//   const $ = await request({
//     gzip: true,
//     transform: cheerio.load,
//     uri: 'http://ru.ufsc.br/cca-2/'
//   })

//   const pdfUri = $('#content ul:first-of-type a:first-child').attr('href')
//   const pdfBuffer = await request({
//     encoding: null,
//     uri: encodeURI(pdfUri)
//   })

//   const pdf = await pdf2table.parseAsync(pdfBuffer)
//   const multi = client.multi().del('cca')
//   for (const row of pdf) {
//     const stuff = []
//     row.forEach(currentValue => {
//       if (/^[A-Z]/.test(currentValue.trim())) {
//         stuff.push(currentValue.trim())
//       } else {
//         stuff.push(`${stuff.pop()} ${currentValue.trim()}`)
//       }
//     })

//     if (stuff.length % 5 !== 0) {
//       continue
//     }

//     stuff.map(element => element.toLowerCase())
//       .filter((element, index) => {
//         return (index % 5) === (weekday - 1) && !ccaIgnores.has(element)
//       })
//       .forEach(element => {
//         multi.rpush('cca', element)
//       })
//   }

//   await multi.execAsync()
// }

exports.ru = async function ru(db, date) {
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
    main: ruify(sanitize(cells.eq(0).text())),
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
