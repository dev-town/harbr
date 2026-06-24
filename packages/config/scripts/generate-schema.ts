#!/usr/bin/env bun

import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { format } from 'prettier'
import { z } from 'zod'
import { configSchema } from '../src/schema'

type JsonObject = Record<string, unknown>

const schemaPath = join(import.meta.dirname, '..', 'harbr.schema.json')
const checkOnly = process.argv.includes('--check')

const { ['~standard']: _standard, ...generatedSchema } = z.toJSONSchema(
  configSchema,
  {
    io: 'input',
    target: 'draft-2020-12',
  },
)

const schema = withClosedObjects({
  $id: 'https://raw.githubusercontent.com/dev-town/harbr/main/packages/config/harbr.schema.json',
  title: 'Harbr Config',
  ...generatedSchema,
})
const serialized = await format(JSON.stringify(schema), { parser: 'json' })

if (checkOnly) {
  const current = await readFile(schemaPath, 'utf8')

  if (current !== serialized) {
    console.error('harbr.schema.json is out of date. Run schema:generate.')
    process.exit(1)
  }
} else {
  await writeFile(schemaPath, serialized, 'utf8')
}

function withClosedObjects(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(withClosedObjects)
  }

  if (!isJsonObject(value)) {
    return value
  }

  const next: JsonObject = {}

  for (const [key, child] of Object.entries(value)) {
    next[key] = withClosedObjects(child)
  }

  if (next.type === 'object' && next.additionalProperties === undefined) {
    next.additionalProperties = false
  }

  return next
}

function isJsonObject(value: unknown): value is JsonObject {
  return typeof value === 'object' && value !== null
}
