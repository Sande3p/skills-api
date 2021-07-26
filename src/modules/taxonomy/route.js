/**
 * the taxonomy routes
 */

const Controller = require('./controller')
const consts = require('../../consts')
const SCOPES = {
  CREATE: 'create:skillsProvider',
  READ: 'read:skillsProvider',
  UPDATE: 'update:skillsProvider',
  DELETE: 'delete:skillsProvider',
  ALL: 'all:skillsProvider'
}

module.exports = {
  '/taxonomies': {
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
  '/taxonomies/:id': {
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
