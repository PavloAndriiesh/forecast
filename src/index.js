const cluster = require('cluster')
const logger = require('./utils/logger')
const config = require('./utils/config')
const sendMail = require('./utils/mailer')

if (cluster.isMaster) {
  cluster.fork()

  cluster.on('exit', function (worker, code, signal) {
    logger.log('info ' + worker.id + ' died. Restarting...', code, signal)

    sendMail({
      to: config.smtpConfig.auth.user,
      subject: 'Crush notification',
      text: 'Forecast app crushed! Please check dashboard to get more information.',
      html: '<div>Forecast app crushed! Please check dashboard to get more information.</div>'
    })
    cluster.fork()
  })
}

if (cluster.isWorker) {
  const express = require('express')
  const app = express()
  const compression = require('compression')
  const bodyParser = require('body-parser')
  const PORT = process.env.PORT || config.port
  const morgan = require('morgan')
  const cors = require('cors')
  const main = require('./controllers/main')

  app.use(cors())
  app.use(express.static(__dirname))
  app.use(bodyParser.json()) // support json encoded bodies
  app.use(bodyParser.urlencoded({extended: true})) // support encoded bodies
  app.use(morgan(':method :url :status :response-time ms', {stream: logger.stream}))
  app.use(compression())
  app.options('*', cors())

  app.get('/', main.client)
  app.get('/dashboard', main.dashboard)
  app.get('/forecast', main.forecast)

  const listen = () => {
    app.listen(PORT, () => {
      /* global APP_VERSION */
      logger.info('Forecast app v.' + APP_VERSION + ' started on port ' + PORT)
    })
  }

  listen()
}
