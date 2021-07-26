# Skills API

## Prerequisites

- node 12.x+
- npm 6.x+
- docker
- elasticsearch 7.7+
- PostgreSQL

## Configuration

Configuration for the application is at `config/default.js` and `config/production.js`. The following parameters can be set in config files or in env variables:

- LOG_LEVEL: the log level
- PORT: the server port
- AUTH_SECRET: TC Authentication secret
- VALID_ISSUERS: valid issuers for TC authentication
- PAGE_SIZE: the default pagination limit
- MAX_PAGE_SIZE: the maximum pagination size
- API_VERSION: the API version
- DB_NAME: the database name
- DB_USERNAME: the database username
- DB_PASSWORD: the database password
- DB_HOST: the database host
- DB_PORT: the database port
- ES_HOST: Elasticsearch host
- ES_REFRESH: Should elastic search refresh. Default is 'true'. Values can be 'true', 'wait_for', 'false'
- ELASTICCLOUD_ID: The elastic cloud id, if your elasticsearch instance is hosted on elastic cloud. DO NOT provide a value for ES_HOST if you are using this
- ELASTICCLOUD_USERNAME: The elastic cloud username for basic authentication. Provide this only if your elasticsearch instance is hosted on elastic cloud
- ELASTICCLOUD_PASSWORD: The elastic cloud password for basic authentication. Provide this only if your elasticsearch instance is hosted on elastic cloud
- ES.DOCUMENTS: Elasticsearch index, type and id mapping for resources.
- SKILL_INDEX: The Elastic search index for skill. Default is `skill`
- SKILL_ENRICH_POLICYNAME: The enrich policy for skill. Default is `skill-policy`
- TAXONOMY_INDEX: The Elastic search index for taxonomy. Default is `taxonomy`
- TAXONOMY_PIPELINE_ID: The pipeline id for enrichment with taxonomy. Default is `taxonomy-pipeline`
- TAXONOMY_ENRICH_POLICYNAME: The enrich policy for taxonomy. Default is `taxonomy-policy`
- MAX_BATCH_SIZE: Restrict number of records in memory during bulk insert (Used by the db to es migration script)
- MAX_BULK_SIZE: The Bulk Indexing Maximum Limits. Default is `100` (Used by the db to es migration script)


## Local deployment

Setup your Postgresql DB and Elasticsearch instance and ensure that they are up and running.

- Follow *Configuration* section to update config values, like database, ES host etc ..
- Goto *skills-api*, run `npm i`
- Create database using `npm run create-db`.
- Run the migrations - `npm run migrations up`. This will create the tables.
- Then run `npm run insert-data` and insert mock data into the database.
- Run `npm run migrate-db-to-es` to sync data with ES.
- Startup server `npm run start`

## Migrations

Migrations are located under the `./scripts/db/` folder. Run `npm run migrations up` and `npm run migrations down` to execute the migrations or remove the earlier ones

## Local Deployment with Docker

- Navigate to the directory `docker-pgsql-es` folder. Rename `sample.env` to `.env` and change any values if required.
- Run `docker-compose up -d` to have docker instances of pgsql and elasticsearch to use with the api

- Create database using `npm run create-db`.
- Run the migrations - `npm run migrations up`. This will create the tables.
- Then run `npm run insert-data` and insert mock data into the database.
- Run `npm run migrate-db-to-es` to sync data with ES.

- Navigate to the directory `docker`

- Rename the file `sample.env` to `.env`

- Set the required DB configurations and ElasticSearch host in the file `.env`

- Once that is done, run the following command

    ```bash
    docker-compose up
    ```

- When you are running the application for the first time, It will take some time initially to download the image and install the dependencies

## NPM Commands

| Command&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; | Description |
|--------------------|--|
| `npm run start`  | Start app |
| `npm run lint`     | Check for for lint errors. |
| `npm run lint:fix` | Check for for lint errors and fix error automatically when possible. |
| `npm run create-db`    | Create the database |
| `npm run insert-data`    | Insert data into the database |
| `npm run migrate-db-to-es`    | Migrate data into elastic search from database |
| `npm run delete-data`  | Delete the data from the database |
| `npm run migrations up`  | Run up migration |
| `npm run migrations down`  | Run down migration |
