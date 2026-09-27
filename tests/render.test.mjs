import { createServer } from 'vite'
import assert from 'node:assert/strict'
const values = new Map()
globalThis.localStorage = { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) }
const server = await createServer({ server: { middlewareMode: true }, appType: 'custom' })
try { const { renderChecks } = await server.ssrLoadModule('/tests/render-checks.jsx'); renderChecks(assert) } finally { await server.close() }
