const fs = require('fs')
const os = require('os')
const path = require('path')

// CSV Functions
const objectToCsv = obj =>
  Object.keys(obj)
    .map(key => '"' + (obj[key] ? obj[key].replace(/\"/g, '""') : '') + '"')
    .join(',')

const objectArrayToCsv = objArray => {
  if (objArray.length) {
    let lines = Object.keys(objArray[0]).join(',') + os.EOL
    lines += objArray.map(objectToCsv).join(os.EOL)
    return lines
  } else {
    console.log('Array is empty')
    return ''
  }
}

// type - file, folder, both
const getFilesFolders = (dir, isRecursive = true, type = 'file') =>
  fs.readdirSync(dir).reduce((files, file) => {
    const name = path.join(dir, file)
    const isDirectory = fs.statSync(name).isDirectory()
    let fileFolder = []
    switch (type) {
      case 'file':
        fileFolder = isDirectory ? [] : [name]
        break
      case 'folder':
        fileFolder = isDirectory ? [name] : []
        break
      default:
        fileFolder = [name]
        break
    }
    const fileFolders = isRecursive && isDirectory ? getFilesFolders(name, isRecursive, type) : []
    return [...files, ...fileFolder, ...fileFolders]
  }, [])

const getProperty = (packageObj, property, subProperty) => {
  return packageObj[property]
    ? typeof packageObj[property] === 'string'
      ? packageObj[property]
      : packageObj[property][subProperty]
    : undefined
}

const LICENSE_TYPES = {
  COPY_LEFT_STRONG: 'Strong Copyleft',
  COPY_LEFT_WEAK: 'Weak Copyleft',
  COPY_LEFT: 'Copyleft',
  PERMISSIVE: 'Permissive',
  SHARE_ALIKE: 'Share-Alike'
}

const getLicenseType = packageObj => {
  const license = getProperty(packageObj, 'license', 'type')
  switch (license) {
    case 'CC0-1.0"':
      return LICENSE_TYPES.SHARE_ALIKE
    case 'CC-BY-3.0':
      return LICENSE_TYPES.SHARE_ALIKE
    case 'Apache-2.0':
      return LICENSE_TYPES.PERMISSIVE
    case 'BSD-2-Clause':
      return LICENSE_TYPES.PERMISSIVE
    case 'BSD-3-Clause':
      return LICENSE_TYPES.PERMISSIVE
    case 'ISC':
      return LICENSE_TYPES.COPY_LEFT
    case 'MIT':
      return LICENSE_TYPES.PERMISSIVE
    case '(MIT OR Apache-2.0)':
      return LICENSE_TYPES.PERMISSIVE
    case '(WTFPL OR MIT)':
      return LICENSE_TYPES.PERMISSIVE
    case 'WTFPL':
      return LICENSE_TYPES.PERMISSIVE
    default:
      return undefined
  }
}

const packageObjList = getFilesFolders(path.join(__dirname, '../node_modules'), true).filter(file => {
  try {
    if (file.endsWith('package.json')) {
      const packageObj = JSON.parse(fs.readFileSync(file))
      return !!packageObj.name && !!packageObj.version
    } else {
      return false
    }
  } catch (error) {
    console.log('Could not properly parse ' + p + '.\nError: ' + error)
    return false
  }
})

const packageInfo = packageObjList
  .map(file => {
    const packageObj = JSON.parse(fs.readFileSync(file))
    return {
      name: packageObj.name,
      version: packageObj.version,
      authors: packageObj.author
        ? typeof packageObj.author === 'string'
          ? packageObj.author
          : Object.keys(packageObj.author)
              .reduce((acc, value) => {
                return acc + packageObj.author[value] + ' '
              }, '')
              .trim()
        : '',
      bugsEmail: packageObj.bugs ? packageObj.bugs.email : '',
      bugsUrl: packageObj.bugs ? packageObj.bugs.url : '',
      // contributors: packageObj.contributors ? packageObj.contributors.join(', ') : undefined,
      desciption: packageObj.desciption,
      email: packageObj.email,
      homepage: packageObj.homepage,
      // keywords: packageObj.keywords, // ? packageObj.keywords.join(', ') : undefined,
      license: getProperty(packageObj, 'license', 'type'),
      licenseType: getLicenseType(packageObj),
      npmUrl: 'https://www.npmjs.com/package/' + packageObj.name,
      repository: getProperty(packageObj, 'repository', 'url'),
      url: packageObj.url
    }
  })
  .sort((a, b) => {
    return a.name > b.name ? 1 : b.name > a.name ? -1 : 0
  })

const licenses = packageObjList.reduce((acc = {}, p) => {
  const packageObj = JSON.parse(fs.readFileSync(p))
  const license = getProperty(packageObj)
  if (license) {
    acc[license] = true
  }
  return acc
}, {})

const csv = objectArrayToCsv(packageInfo)
fs.writeFileSync('test.csv', csv)
