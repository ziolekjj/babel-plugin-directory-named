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

const hasGoodSuffix = (path) => {
  if(path.endsWith(`/${EXTENSION}`) || path.endsWith(`.${EXTENSION}`)) return false
  return true
}

// We do not want to extend directory-named into node_modules. This can become
// a configuration option.
const excludeModules = (filename, exclude = '/node_modules/') => {
  return filename.includes(exclude)
}

const getNewPath = (value, filename, root = '.', honorIndex) => {
  if (path.extname(value) !== '') return null
  const split = value.split(SPLIT_CHAR)
  const dir = split.slice(-1)[0]
  const newPath = [...split, dir].join(SPLIT_CHAR) + EXTENSION

  if (path.isAbsolute(newPath) || !newPath.startsWith('.')) {
    const fullAbsolutePath = path.resolve(root, newPath)
    if (!exists(fullAbsolutePath)) return null
    const newRelativePath = path.relative(path.dirname(filename), fullAbsolutePath)
    if(!newRelativePath.startsWith('.')) return `./${newRelativePath}`
    return newRelativePath
  } else if (hasGoodSuffix(newPath)){

    // test if regular import paths work: `path/to/import/index.js`
    if (honorIndex) {
      const regularImportPath = `${value}/index.js`
      if (exists(path.resolve(path.resolve(filename, '..'), regularImportPath))) {
        return regularImportPath
      }
    }
    
    const fullPath = path.resolve(path.resolve(filename, '..'), newPath)
    if (!exists(fullPath)) return null
    return newPath
  } else {
    const optimizedPath = newPath.endsWith(`..${EXTENSION}`)
      ? `${newPath.slice(0, -EXTENSION.length)}/`
      : newPath.slice(0, -(EXTENSION.length + 1))
    const dirPath = path.resolve(path.resolve(filename, '..'), optimizedPath)
    const dirName = dirPath.split(SPLIT_CHAR).slice(-1)[0]
    const fullPath = path.resolve(dirPath, dirName + EXTENSION)
    if (!exists(fullPath)) return null
    const newOptimizedPath = `${optimizedPath}${dirName}${EXTENSION}`
    return newOptimizedPath
  }
}

const isRequire = (node, t) => {
  const args = node.arguments || []
  if (node.callee.name === 'require' && args.length === 1 && t.isStringLiteral(args[0])) return true
  return false
}

const getRootDir = (state) => {
  return state.opts.rootDir || 'src'
}

const getHonorIndex = (state) => {
  return state.opts.honorIndex
}

export default function visitor ({ types: t }) {
  return {
    visitor: {
      ImportDeclaration (path, state) {
        const { value } = path.node.source
        const { filename } = state.file.opts

        if (excludeModules(filename)) {
          return
        }

        const rootDir = getRootDir(state)
        const honorIndex = getHonorIndex(state)
        const newPath = getNewPath(value, filename, rootDir, honorIndex)
        if (!newPath) return
        const newSource = t.stringLiteral(value.replace(value, newPath))
        path.node.source = newSource
      },

      ExportDeclaration (path, state) {
        if (!hasSource(path)) return
        const { value } = path.node.source
        const { filename } = state.file.opts
        
        if (excludeModules(filename)) {
          return
        }

        const rootDir = getRootDir(state)
        const honorIndex = getHonorIndex(state)
        const newPath = getNewPath(value, filename, rootDir, honorIndex)
        if (!newPath) return
        const newSource = t.stringLiteral(value.replace(value, newPath))
        path.node.source = newSource
      },

      CallExpression (path, state) {
        const { node } = path
        if (!isRequire(node, t)) return
        const { value } = node.arguments[0]
        const { filename } = state.file.opts

        if (excludeModules(filename)) {
          return
        }

        const rootDir = getRootDir(state)
        const honorIndex = getHonorIndex(state)
        const newPath = getNewPath(value, filename, rootDir, honorIndex)
        if (!newPath) return
        path.node.arguments[0] = t.stringLiteral(value.replace(value, newPath))
      }
    }
  }
}
