# Multitenancy with subdomain

- This repository implements a schema-based multitenancy on subdomains with keycloak

## To run infrastructure

docker-compose up --build -d

## Setting Keycloak up

- set env variables on wrapper-keycloak
  - KEYCLOAK_ADMIN_USERNAME
  - KEYCLOAK_ADMIN_PASSWORD
- add a client in 'clients menu' for our Nest.js app that will communicate with keycloak
  - client authentication -> on
  - authorization -> on
  - authentication flow -> standard flow
  - direct access grantes -> on
  - service account roles
  - save client
  - get your client_secret in credentials tab and set KEYCLOAK_CLIENT_SECRET env variable
  - your client-id is the name of the client, also set KEYCLOAK_CLIENT_ID env variable
- get keycloak's public key token
  - go to master realm
  - realm settings
  - keys tab
  - find the algorithm RS256 with provider rsa-generated and click on public key
  - copy this key and set KEYCLOAK_PUBLIC_KEY_JWT_SECRET env variable using the following pattern: '-----BEGIN PUBLIC KEY-----\<KEY HERE>\n-----END PUBLIC KEY-----'
  - this key is important because it is used as a way to verify the token so we don't have to make a HTTP request to validate
- set your access and refresh token lifespans with the following variables
  - ACESS_TOKEN_LIFESPAN
  - REFRESH_TOKEN_LIFESPAN

## Configuring application

- set variables
  - POSTGRES_HOST
  - POSTGRES_PORT
  - POSTGRES_DB
  - POSTGRES_USER
  - POSTGRES_PASSWORD

## Run wrapper-keycloak migrations

npm run typeorm:run-public-migration

## Now you are ready to go


### TODO

endpoint to exchange user token (switching environments/tenants)
- resource profiles