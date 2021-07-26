const querystring = require('querystring')
const errors = require('./errors')
const appConst = require('../consts')
const _ = require('lodash')
const { getControllerMethods } = require('./controller-helper')

/**
 * get auth user handle or id
 * @param authUser the user
 */
function getAuthUser (authUser) {
  return authUser.handle || authUser.sub
}

/**
 * Checks if the source matches the term.
 *
 * @param {Array} source the array in which to search for the term
 * @param {Array | String} term the term to search
 */
function checkIfExists (source, term) {
  let terms

  if (!_.isArray(source)) {
    throw new Error('Source argument should be an array')
  }

  source = source.map(s => s.toLowerCase())

  if (_.isString(term)) {
    terms = term.split(' ')
  } else if (_.isArray(term)) {
    terms = term.map(t => t.toLowerCase())
  } else {
    throw new Error('Term argument should be either a string or an array')
  }

  for (let i = 0; i < terms.length; i++) {
    if (source.includes(terms[i])) {
      return true
    }
  }

  return false
}

/**
 * Get link for a given page.
 * @param {Object} req the HTTP request
 * @param {Number} page the page number
 * @returns {String} link for the page
 */
function getPageLink (req, page) {
  const q = _.assignIn({}, req.query, { page })
  return `${req.protocol}://${req.get('Host')}${req.baseUrl}${req.path}?${querystring.stringify(q)}`
}

/**
 * Set HTTP response headers from result.
 * @param {Object} req the HTTP request
 * @param {Object} res the HTTP response
 * @param {Object} result the operation result
 */
function injectSearchMeta (req, res, result) {
  // if result is got from db, then do not set response headers
  if (result.fromDB) {
    return
  }

  const resultTotal = _.isNumber(result.total) ? result.total : result.total.value

  const totalPages = Math.ceil(resultTotal / result.perPage)
  if (result.page > 1) {
    res.set('X-Prev-Page', +result.page - 1)
  }
  if (result.page < totalPages) {
    res.set('X-Next-Page', +result.page + 1)
  }
  res.set('X-Page', result.page)
  res.set('X-Per-Page', result.perPage)
  res.set('X-Total', resultTotal)
  res.set('X-Total-Pages', totalPages)
  // set Link header
  if (totalPages > 0) {
    let link = `<${getPageLink(req, 1)}>; rel="first", <${getPageLink(req, totalPages)}>; rel="last"`
    if (result.page > 1) {
      link += `, <${getPageLink(req, result.page - 1)}>; rel="prev"`
    }
    if (result.page < totalPages) {
      link += `, <${getPageLink(req, result.page + 1)}>; rel="next"`
    }
    res.set('Link', link)
  }

  // Allow browsers access pagination data in headers
  let accessControlExposeHeaders = res.get('Access-Control-Expose-Headers') || ''
  accessControlExposeHeaders += accessControlExposeHeaders ? ', ' : ''
  // append new values, to not override values set by someone else
  accessControlExposeHeaders += 'X-Page, X-Per-Page, X-Total, X-Total-Pages, X-Prev-Page, X-Next-Page'

  res.set('Access-Control-Expose-Headers', accessControlExposeHeaders)
}

/**
 * some user can only access devices that they created. admin role user can access all devices
 * @param auth the auth object
 * @param recordObj the record object
 */
function permissionCheck (auth, recordObj) {
  if (
    auth &&
    auth.roles &&
    !checkIfExists(auth.roles, appConst.AdminUser) &&
    !checkIfExists(auth.roles, [appConst.UserRoles.ubahn]) &&
    recordObj.createdBy !== getAuthUser(auth)) {
    throw errors.newPermissionError('You are not allowed to perform this action')
  }
}

/**
 * Removes the audit fields created, createdBy, updatedBy from the given entity or an array of entities
 * and moves the updated to metadata
 * @param entity a single entity or an array of entities
 * @returns the modified entity
 */
function omitAuditFields (entity) {
  function _omit (result) {
    const metadata = _.get(result, 'metadata') || {}
    metadata.updated = _.get(result, 'updated')
    result.metadata = metadata
    return _.omit(result, ['created', 'updated', 'createdBy', 'updatedBy'])
  }

  if (!entity) { return entity }

  if (_.isArray(entity)) {
    return entity.map(i => _omit(i))
  } else {
    return _omit(entity)
  }
}

module.exports = {
  getAuthUser,
  permissionCheck,
  checkIfExists,
  injectSearchMeta,
  getControllerMethods,
  omitAuditFields
}
