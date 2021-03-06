const _ = require('lodash')
const config = require('config')
const sequelize = require('../../src/models/index')
const dbHelper = require('../../src/common/db-helper')
const serviceHelper = require('../../src/common/service-helper')
const logger = require('../../src/common/logger')
const { getESClient } = require('../../src/common/es-client')
const {
  topResources,
  modelToESIndexMapping
} = require('../constants')

const models = sequelize.models

// Declares the ordering of the resource data insertion, to ensure that enrichment happens correctly
const RESOURCES_IN_ORDER = [
  'taxonomy',
  'skill'
]

const client = getESClient()

const RESOURCE_NOT_FOUND = 'resource_not_found_exception'
const INDEX_NOT_FOUND = 'index_not_found_exception'

/**
 * Cleans up the data in elasticsearch
 * @param {Array} keys Array of models
 */
async function cleanupES (keys) {
  const client = getESClient()
  try {
    await client.ingest.deletePipeline({
      id: topResources.taxonomy.pipeline.id
    })
  } catch (e) {
    if (e.meta && e.meta.body.error.type === RESOURCE_NOT_FOUND) {
      // Ignore
    } else {
      throw e
    }
  }

  try {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i]
      if (models[key].tableName) {
        const esResourceName = modelToESIndexMapping[key]
        if (_.includes(_.keys(topResources), esResourceName)) {
          if (topResources[esResourceName].enrich) {
            try {
              await client.enrich.deletePolicy({
                name: topResources[esResourceName].enrich.policyName
              })
            } catch (e) {
              if (e.meta && e.meta.body.error.type === RESOURCE_NOT_FOUND) {
                // Ignore
              } else {
                throw e
              }
            }
          }

          try {
            await client.indices.delete({
              index: topResources[esResourceName].index
            })
          } catch (e) {
            if (e.meta && e.meta.body.error.type === INDEX_NOT_FOUND) {
              // Ignore
            } else {
              throw e
            }
          }
        }
      }
    }
  } catch (e) {
    console.log(JSON.stringify(e))
    throw e
  }
  console.log('Existing data in elasticsearch has been deleted!')
}

async function insertBulkIntoES (esResourceName, dataset) {
  if (!esResourceName) {
    logger.error(`Cannot insert data into esResourceName ${esResourceName} as it's not found`)
    return
  }

  const resourceConfig = config.get(`ES.DOCUMENTS.${esResourceName}`)

  const chunked = _.chunk(dataset, config.get('ES.MAX_BULK_SIZE'))
  for (const ds of chunked) {
    const body = _.flatMap(ds, doc => [{ index: { _id: doc.id } }, doc])
    try {
      await client.bulk({
        index: resourceConfig.index,
        type: resourceConfig.type,
        body,
        pipeline: resourceConfig.ingest ? resourceConfig.ingest.pipeline.id : undefined,
        refresh: 'wait_for'
      })
    } catch (e) {
      logger.error('ES, create mapping error.')
      logger.error(JSON.stringify(e))
    }
  }
}

/**
 * Creates and executes the enrich policy for the provided model
 * @param {String} modelName The model name
 */
async function createAndExecuteEnrichPolicy (modelName) {
  const esResourceName = modelToESIndexMapping[modelName]

  if (_.includes(_.keys(topResources), esResourceName) && topResources[esResourceName].enrich) {
    await client.enrich.putPolicy({
      name: topResources[esResourceName].enrich.policyName,
      body: {
        match: {
          indices: topResources[esResourceName].index,
          match_field: topResources[esResourceName].enrich.matchField,
          enrich_fields: topResources[esResourceName].enrich.enrichFields
        }
      }
    })
    await client.enrich.executePolicy({ name: topResources[esResourceName].enrich.policyName })
  }
}

/**
 * Creates the ingest pipeline using the enrich policy
 * @param {String} modelName The model name
 */
async function createEnrichProcessor (modelName) {
  const esResourceName = modelToESIndexMapping[modelName]

  if (_.includes(_.keys(topResources), esResourceName) && topResources[esResourceName].pipeline) {
    if (topResources[esResourceName].pipeline.processors) {
      const processors = []

      for (let i = 0; i < topResources[esResourceName].pipeline.processors.length; i++) {
        const ep = topResources[esResourceName].pipeline.processors[i]
        processors.push({
          foreach: {
            field: ep.referenceField,
            ignore_missing: true,
            processor: {
              enrich: {
                policy_name: ep.enrichPolicyName,
                ignore_missing: true,
                field: ep.field,
                target_field: ep.targetField,
                max_matches: ep.maxMatches
              }
            }
          }
        })
      }

      await client.ingest.putPipeline({
        id: topResources[esResourceName].pipeline.id,
        body: {
          processors
        }
      })
    } else {
      await client.ingest.putPipeline({
        id: topResources[esResourceName].pipeline.id,
        body: {
          processors: [{
            enrich: {
              policy_name: topResources[esResourceName].enrich.policyName,
              field: topResources[esResourceName].pipeline.field,
              target_field: topResources[esResourceName].pipeline.targetField,
              max_matches: topResources[esResourceName].pipeline.maxMatches
            }
          }]
        }
      })
    }
  }
}

/**
 * import test data
 * @return {Promise<void>}
 */
async function main () {
  let keys = Object.keys(models)

  // Sort the models in the order of insertion (for correct enrichment)
  const temp = Array(keys.length).fill(null)
  keys.forEach(k => {
    if (sequelize.models[k].name) {
      const esResourceName = modelToESIndexMapping[k]
      const index = RESOURCES_IN_ORDER.indexOf(esResourceName)
      temp[index] = k
    }
  })
  keys = _.compact(temp)

  await cleanupES(keys)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const queryPage = { perPage: parseInt(config.get('ES.MAX_BATCH_SIZE'), 10), page: 1 }
    try {
      while (true) {
        const data = await dbHelper.find(models[key], { ...queryPage })
        for (let i = 0; i < data.length; i++) {
          logger.info(`Inserting data ${(i + 1) + (queryPage.perPage * (queryPage.page - 1))}`)
          logger.info(JSON.stringify(data[i]))
          if (!_.isString(data[i].created)) {
            data[i].created = new Date()
          }
          if (!_.isString(data[i].updated)) {
            data[i].updated = new Date()
          }
          if (!_.isString(data[i].createdBy)) {
            data[i].createdBy = 'tcAdmin'
          }
          if (!_.isString(data[i].updatedBy)) {
            data[i].updatedBy = 'tcAdmin'
          }
        }
        await insertBulkIntoES(serviceHelper.getResource(key), data)
        if (data.length < queryPage.perPage) {
          logger.info('import data for ' + key + ' done')
          break
        } else {
          queryPage.page = queryPage.page + 1
        }
      }
    } catch (e) {
      logger.error(JSON.stringify(_.get(e, 'meta.body', ''), null, 4))
      logger.error(_.get(e, 'meta.meta.request.params.method', ''))
      logger.error(_.get(e, 'meta.meta.request.params.path', ''))
      logger.warn('import data for ' + key + ' failed')
      continue
    }
    try {
      await createAndExecuteEnrichPolicy(key)
      logger.info('create and execute enrich policy for ' + key + ' done')
    } catch (e) {
      logger.error(JSON.stringify(_.get(e, 'meta.body', ''), null, 4))
      logger.warn('create and execute enrich policy for ' + key + ' failed')
    }

    try {
      await createEnrichProcessor(key)
      logger.info('create enrich processor (pipeline) for ' + key + ' done')
    } catch (e) {
      logger.error(JSON.stringify(_.get(e, 'meta.body', ''), null, 4))
      logger.warn('create enrich processor (pipeline) for ' + key + ' failed')
    }
  }
  logger.info('all done')
  process.exit(0)
}

(async () => {
  main().catch(err => console.error(err))
})()
