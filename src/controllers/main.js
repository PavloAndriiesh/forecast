const Forecast = require('forecast')
const config = require('config')
const request = require('superagent')
const logger = require('../utils/logger')

const Bali = {
  latitude: -8.409518,
  longitude: 115.188919
}

exports.forecast = (req, res) => {
  const forecast = new Forecast({
    service: config.get('forecast.service'),
    key: config.get('forecast.key'),
    units: 'celcius',
    cache: true
  })

  let {latitude, longitude} = req.query

  const getForecast = (latitude, longitude) => {
    logger.info('latitude:  ' + latitude + ', longitude' + longitude)
    forecast.get([latitude, longitude], (err, weather) => {
      if (err) return res.status(404).send(err)
      res.send(weather)
    })
  }

  if (!latitude || !longitude) {
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress
    if (!ip || ip === '::1') {
      getForecast(Bali.latitude, Bali.longitude)
    } else {
      request
        .get('http://ipinfo.io/' + ip)
        .set('Accept', 'application/json')
        .end((err, response) => {
          if (err || !response.ok) {
            getForecast(Bali.latitude, Bali.longitude)
          } else {
            latitude = response.body.loc.split(',')[0]
            longitude = response.body.loc.split(',')[1]

            getForecast(latitude, longitude)
          }
        })
    }
  } else {
    getForecast(latitude, longitude)
  }
}

exports.dashboard = (req, res) => {
  res.sendFile('logfile.log', {root: __dirname})
}
