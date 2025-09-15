#!/usr/bin/env bash

# read in the entity name input

# create directory and entity file for TypeORM
mkdir -p src/{entity_name}/entities
touch src/{entity_name}/entities/{entity_name}.entity.ts

# npx
npx nest generate module {entity_name}
npx nest generate service {entity_name}
npx nest generate controller {entity_name}
