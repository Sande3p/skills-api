/**
 * the skill routes
 */

const Controller = require('./controller')
const consts = require('../../consts')

module.exports = {
  '/health': {
    get: {
      method: Controller.checkHealth
    }
  }
}
