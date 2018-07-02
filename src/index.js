import path from 'path'
import fs from 'fs'

const EXTENSION = '.js'
const SPLIT_CHAR = '/'

const exists = (path) => {
  if (fs.existsSync(path) && fs.statSync(path).isFile()) return true
  else return false
}

const hasSource = (path) => {
  if (!path.node.source) return false
  return true
}

const getNewPath = (value) => {
  if (path.extname(value) !== '') return null
  const split = value.split(SPLIT_CHAR)
  const dir = split.slice(-1)[0]
  const newPath = [...split, dir].join(SPLIT_CHAR) + EXTENSION
  if (!exists(newPath)) return null
  return newPath
}

const isRequire = (node, t) => {
  const args = node.arguments || []
  if (node.callee.name === 'require' && args.length === 1 && t.isStringLiteral(args[0])) return true
  return false
}

export default function visitor ({ types: t }) {
  return {
    visitor: {
      ImportDeclaration (path) {
        const { value } = path.node.source
        const newPath = getNewPath(value)
        if (newPath) {
          const newSource = t.stringLiteral(value.replace(value, newPath))
          path.node.source = newSource
        }
      },

      ExportDeclaration (path) {
        if (!hasSource(path)) return
        const { value } = path.node.source
        const newPath = getNewPath(value)
        const newSource = t.stringLiteral(value.replace(value, newPath))
        path.node.source = newSource
      },

      CallExpression (path) {
        const { node } = path
        if (!isRequire(node, t)) return
        const { value } = node.arguments[0]
        const newPath = getNewPath(value)
        path.node.arguments[0] = t.stringLiteral(value.replace(value, newPath))
      }
    }
  }
}
