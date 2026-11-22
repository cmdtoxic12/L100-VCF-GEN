import { neon } from '@neondatabase/serverless'

export class DbNotConfiguredError extends Error {
  constructor() {
    super('DATABASE_URL is not set')
    this.name = 'DbNotConfiguredError'
  }
}

let cachedUrl = ''
let cachedSql = null

export function isDbConfigured() {
  return Boolean(process.env.DATABASE_URL?.trim())
}

/** Reuse one Neon client per warm function instance. */
export function getSQL() {
  const url = process.env.DATABASE_URL?.trim()
  if (!url) throw new DbNotConfiguredError()

  if (!cachedSql || cachedUrl !== url) {
    cachedSql = neon(url)
    cachedUrl = url
  }
  return cachedSql
}
