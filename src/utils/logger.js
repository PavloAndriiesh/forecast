const winston = require('winston')
const dateFormat = require('dateformat')
const nodemailer = require('nodemailer')
const config = require('config')

const timestamp = () => dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss', true)

const formatter = (options) => {
  return options.timestamp() + ' ' + options.level.toUpperCase() + ' ' + (options.message ? options.message : '') +
      (options.meta && Object.keys(options.meta).length ? '\n\t' + JSON.stringify(options.meta) : '')
}

const filename = './build/logfile.log'

const transporter = nodemailer.createTransport(config.get('smtp'))

winston.handleExceptions(new winston.transports.File({ filename }))

const logger = new (winston.Logger)({
  levels: {
    'error': 0,
    'info': 1,
    'http': 2
  },
  transports: [
    new (winston.transports.Console)({
      level: 'http',
      handleExceptions: true,
      json: false,
      colorize: true,
      timestamp,
      formatter
    }),
    new (winston.transports.File)({
      filename,
      level: 'http',
      handleExceptions: true,
      json: false,
      maxsize: 10485760, // 10 Mb
      maxFiles: 1,
      colorize: false,
      timestamp,
      formatter
    })
  ],
  exitOnError: false
})

logger.stream = {
  write: message => logger.log('http', message.trim())
}

logger.sendErrorMail = () => {
  const options = {
    from: 'Forecast <' + config.get('auth.user') + '>',
    to: config.get('adminEmail'),
    subject: 'Crush notification',
    text: 'Forecast app crushed! Please check dashboard to get more information.',
    html: '<div>Forecast app crushed! Please check dashboard to get more information.</div>'
  }

  transporter.sendMail(options, (error, info) => {
    if (error) {
      logger.error(`Send error mail to ${options.to}`, error)
    }
  })
}

module.exports = logger
