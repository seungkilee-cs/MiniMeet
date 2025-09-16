#!/usr/bin/env bash

ENTITY_NAME=$1

# Check if an entity name was provided
if [ -z "$ENTITY_NAME" ]; then
  echo "Error: Please provide an entity name."
  echo "Usage: $0 <EntityName>"
  exit 1
fi

# Create directory and entity file for TypeORM
echo "Creating files for entity: $ENTITY_NAME"
mkdir -p "src/$ENTITY_NAME/entities"
touch "src/$ENTITY_NAME/entities/$ENTITY_NAME.entity.ts"

# Generate NestJS module, service, and controller
npx nest generate module "$ENTITY_NAME"
npx nest generate service "$ENTITY_NAME"
npx nest generate controller "$ENTITY_NAME"

echo "Successfully created resources for $ENTITY_NAME."
