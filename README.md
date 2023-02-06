# Multitenancy with subdomain

- This repository implements a schema-based multitenancy on subdomains with keycloak

## To run infrastructure

docker-compose up --build -d

## Setting Keycloak up

- set env variables on wrapper-keycloak
  - KEYCLOAK_ADMIN_USERNAME
  - KEYCLOAK_ADMIN_PASSWORD
- add a client in 'clients menu' for our Nest.js app that will communicate with keycloak
  - client protocol - openid-connect
  - client access type must be confidential
  - save client
  - get your client_secret in credentials tab and set KEYCLOAK_CLIENT_SECRET env variable
  - your client-id is the name of the client, also set KEYCLOAK_CLIENT_ID env variable
- get keycloak's public key token
  - go to master realm
  - realm settings
  - key tab
  - find the algorithm RS256 with provider rsa-generated and click on public key
  - copy this key and set KEYCLOAK_PUBLIC_KEY_JWT_SECRET env variable using the following pattern: '-----BEGIN PUBLIC KEY-----\<KEY HERE>\n-----END PUBLIC KEY-----'
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

## Now you are ready to go

