'use strict'

require('json5/lib/register')
const chalk = require('chalk')
const cheerio = require('cheerio')
const superagent = require('superagent')

function padStart (input, length = 0) {
  return String(input).padStart(length)
}

async function save (games) {
  const response = await superagent
    .post(`https://script.google.com/macros/s/${require('./config.json5').script}/exec`)
    .send({ method: 'save', games: games })
    .set('content-type', 'application/json')
  process.stdout.write('\n')
  console.log(await response.body)
}

;(async () => {
  const uri = 'https://gama-gama.ru/?genre2=actions'
  const response = await superagent.get(uri)
  const $ = cheerio.load(await response.text)
  const rows = $('div.catalog-content a')
  const rowsCount = rows.length
  const games = []
  rows.each((i, x) => {
    const game = {
      id: x.attribs.href.match(/\/detail\/(.+)\/$/)[1],
      name: $(x).find('.catalog_name .cropable').text(),
      off: $(x).find('.price_discount').text().match(/\d+/g).join(''),
      old: $(x).find('.old_price').text().match(/\d+/g).join(''),
      now: $(x).find('.promo_price').text().match(/\d+/g).join('')
    }
    games.push(game)
    process.stdout.write(chalk.bgGray(` [${padStart(i + 1, String(rowsCount).length)}/${rowsCount}] `))
    process.stdout.write(chalk.bgRed(` ${padStart(game.off, 3)}% `))
    process.stdout.write(chalk.red(` ${padStart(Number(game.old) - Number(game.now), 6)} `))
    process.stdout.write(chalk.green(` ${padStart(game.now, 5)} `))
    process.stdout.write(chalk.green(` ${game.name} `))
    process.stdout.write('\n')
  })
  await save(games)
})()
