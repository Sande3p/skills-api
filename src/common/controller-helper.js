/**
 * get common controller service
 * @param service the service
 * @return {{patch: patch, search: search, get: get, create: create, update: update, remove: remove}} the common controller methods
 */
function getControllerMethods (service) {
  const { injectSearchMeta } = require('./helper')

  /**
   * create entity by request data
   * @param req the http request
   * @param res the http response
   */
  async function create (req, res) {
    res.json(await service.create(req.body, req.auth))
  }

  /**
   * patch entity by id
   * @param req the http request
   * @param res the http response
   */
  async function patch (req, res) {
    res.json(await service.patch(req.params.id, req.body, req.auth))
  }

  /**
   * get entity by id
   * @param req the http request
   * @param res the http response
   */
  async function get (req, res) {
    res.json(await service.get(req.params.id, req.auth, req.query))
  }

  /**
   * search entities by request query
   * @param req the http request
   * @param res the http response
   */
  async function search (req, res) {
    const result = await service.search(req.query, req.auth)
    injectSearchMeta(req, res, result)
    res.send(result.result)
  }

  /**
   * remove entity by id
   * @param req the http request
   * @param res the http response
   */
  async function remove (req, res) {
    await service.remove(req.params.id, req.auth)
    res.status(204).end()
  }

  return {
    create,
    search,
    remove,
    get,
    patch
  }
}

module.exports = { getControllerMethods }
