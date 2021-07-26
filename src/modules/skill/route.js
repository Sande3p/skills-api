/**
 * the skill routes
 */

const Controller = require('./controller')
const consts = require('../../consts')
const SCOPES = {
  CREATE: 'create:skill',
  READ: 'read:skill',
  UPDATE: 'update:skill',
  DELETE: 'delete:skill',
  ALL: 'all:skill'
}

module.exports = {
  '/skills': {
    get: {
      method: Controller.search,
      auth: 'jwt',
      access: consts.AllAuthenticatedUsers,
      scopes: [SCOPES.READ, SCOPES.ALL]
    },
    post: {
      method: Controller.create,
      auth: 'jwt',
      access: consts.AllAuthenticatedUsers,
      scopes: [SCOPES.CREATE, SCOPES.ALL]
    },
    head: {
      method: Controller.search,
      auth: 'jwt',
      access: consts.AllAuthenticatedUsers,
      scopes: [SCOPES.READ, SCOPES.ALL]
    }
  },
  '/skills/:id': {
    get: {
      method: Controller.get,
      auth: 'jwt',
      access: consts.AllAuthenticatedUsers,
      scopes: [SCOPES.READ, SCOPES.ALL]
    },
    head: {
      method: Controller.get,
      auth: 'jwt',
      access: consts.AllAuthenticatedUsers,
      scopes: [SCOPES.READ, SCOPES.ALL]
    },
    patch: {
      method: Controller.patch,
      auth: 'jwt',
      access: consts.AllAuthenticatedUsers,
      scopes: [SCOPES.UPDATE, SCOPES.ALL]
    },
    delete: {
      method: Controller.remove,
      auth: 'jwt',
      access: [...consts.AdminUser, consts.UserRoles.ubahn],
      scopes: [SCOPES.DELETE, SCOPES.ALL]
    }
  }
}
