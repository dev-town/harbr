#!/usr/bin/env bun

import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import ts from 'typescript'

const root = path.resolve(import.meta.dirname, '..')
const packageRoots = [
  'apps/tui',
  ...(await readdir(path.join(root, 'packages'))).map((name) => `packages/${name}`),
]
const packages = new Map<string, { root: string; exports: Set<string> }>()

for (const packageRoot of packageRoots) {
  const manifest = JSON.parse(
    await readFile(path.join(root, packageRoot, 'package.json'), 'utf8'),
  ) as {
    name: string
    exports?: Record<string, string>
  }
  packages.set(manifest.name, {
    root: packageRoot,
    exports: new Set(Object.keys(manifest.exports ?? {})),
  })
}

// These are the source dependency directions enforced by the former ESLint boundaries config.
const allowed: Record<string, string[]> = {
  '@harbr/tui': [
    '@harbr/domain',
    '@harbr/db',
    '@harbr/config',
    '@harbr/git',
    '@harbr/runtime',
    '@harbr/runtime-herdr',
    '@harbr/runtime-tmux',
    '@harbr/scanner',
    '@harbr/reconciler',
    '@harbr/test-utils',
  ],
  '@harbr/domain': [],
  '@harbr/db': ['@harbr/domain'],
  '@harbr/config': ['@harbr/domain'],
  '@harbr/git': ['@harbr/domain'],
  '@harbr/runtime': ['@harbr/domain'],
  '@harbr/runtime-herdr': ['@harbr/domain', '@harbr/runtime'],
  '@harbr/runtime-tmux': ['@harbr/domain', '@harbr/runtime'],
  '@harbr/scanner': ['@harbr/domain', '@harbr/config', '@harbr/git', '@harbr/runtime'],
  '@harbr/reconciler': ['@harbr/domain', '@harbr/db', '@harbr/scanner'],
  '@harbr/test-utils': ['@harbr/domain', '@harbr/db', '@harbr/config'],
}

const errors: string[] = []

for (const [owner, meta] of packages) {
  if (!(owner in allowed)) continue
  const sourceRoot = path.join(root, meta.root, 'src')
  for (const file of await sourceFiles(sourceRoot)) {
    const code = await readFile(file, 'utf8')
    const source = ts.createSourceFile(file, code, ts.ScriptTarget.Latest, true)
    const visit = (node: ts.Node) => {
      let specifier: string | undefined
      if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
        specifier =
          node.moduleSpecifier && ts.isStringLiteral(node.moduleSpecifier)
            ? node.moduleSpecifier.text
            : undefined
      } else if (
        ts.isImportEqualsDeclaration(node) &&
        ts.isExternalModuleReference(node.moduleReference)
      ) {
        const expression = node.moduleReference.expression
        specifier = expression && ts.isStringLiteral(expression) ? expression.text : undefined
      } else if (ts.isCallExpression(node) && node.arguments.length === 1) {
        const isImport = node.expression.kind === ts.SyntaxKind.ImportKeyword
        const isRequire = ts.isIdentifier(node.expression) && node.expression.text === 'require'
        const argument = node.arguments[0]
        if ((isImport || isRequire) && argument && ts.isStringLiteral(argument))
          specifier = argument.text
      }
      if (specifier) checkImport(owner, file, source, node, specifier)
      ts.forEachChild(node, visit)
    }
    visit(source)
  }
}

if (errors.length) {
  console.error(errors.join('\n'))
  process.exit(1)
}

console.log('Package boundaries passed')

async function sourceFiles(directory: string): Promise<string[]> {
  const result: string[] = []
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name)
    if (entry.isDirectory()) result.push(...(await sourceFiles(file)))
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) result.push(file)
  }
  return result
}

function checkImport(
  owner: string,
  file: string,
  source: ts.SourceFile,
  node: ts.Node,
  specifier: string,
) {
  const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1
  const location = `${path.relative(root, file)}:${line}`
  const fail = (reason: string) => errors.push(`${location}: ${reason} (${specifier})`)

  if (specifier.startsWith('~/') && owner !== '@harbr/tui') {
    fail('~/* is reserved for apps/tui')
  }

  if (specifier.startsWith('.')) {
    const target = path.resolve(path.dirname(file), specifier)
    const ownerRoot = path.join(root, packages.get(owner)!.root)
    if (target !== ownerRoot && !target.startsWith(`${ownerRoot}${path.sep}`)) {
      fail('relative import crosses a package boundary')
    }
    return
  }

  if (!specifier.startsWith('@harbr/')) return
  const match = /^(@harbr\/[^/]+)(?:\/(.*))?$/.exec(specifier)
  const targetName = match?.[1]
  const target = targetName && packages.get(targetName)
  if (!targetName || !target) {
    fail('unknown Harbr package')
    return
  }
  const isTest = /\.test\.[cm]?[jt]sx?$/.test(file)
  if (owner !== targetName && !isTest && !allowed[owner]?.includes(targetName)) {
    fail(`${owner} cannot depend on ${targetName}`)
  }
  const exportKey = match?.[2] ? `./${match[2]}` : '.'
  if (!target.exports.has(exportKey)) fail(`${targetName} does not export ${exportKey}`)
  if (
    owner === '@harbr/scanner' &&
    targetName === '@harbr/runtime-tmux' &&
    exportKey !== './discovery'
  ) {
    fail('scanner may only use runtime-tmux/discovery')
  }
}
