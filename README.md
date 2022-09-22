# Prototype of Micro-services runtime in NodeJS

## High level system design
![System design](docs/system-design.png?raw=true "System Design")

## Features
- Spawn multiple service instances using different adapters i.e. [ExpressJS](https://expressjs.com)
, [Postgraphile](https://www.graphile.org/postgraphile/), [GraphQL Helix](https://www.graphql-helix.com), ...
- Routing HTTP request to respective service handlers
- Allow service instances communicate with each other
