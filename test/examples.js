const pathResolve = require('path').resolve

// load environment variables into process.env.*
require('dotenv').config()

const glob = require('glob')
const proxyquire = require('proxyquire').noCallThru()

const Octokit = require('../')

const examplesPaths = glob.sync('*.js', {
  cwd: pathResolve(process.cwd(), 'examples')
})

examplesPaths.forEach(runExample)

function runExample (name) {
  proxyquire(`../examples/${name}`, {
    '@octokit/rest': function (options) {
      if (!options) options = {}
      options.debug = false
      const octokit = Octokit(options)

          // set a EXAMPLES_GITHUB_TOKEN environment variable to avoid
          // running against GitHub's rate limiting
      if (process.env.EXAMPLES_GITHUB_TOKEN) {
        octokit.authenticate({
          type: 'token',
          token: process.env.EXAMPLES_GITHUB_TOKEN
        })
      }

      return octokit
    }
  })
}

process.on('unhandledRejection', (error) => {
  if (error.code === 401) {
    // this is due to our invalid authentication token, so we ignore it
    return
  }

  if (error.code === 403) {
    // when API rate limit is reached 403 Forbidden is thrown
    return
  }

  if (/getaddrinfo ENOTFOUND github.my-ghe-enabled-company.com/.test(error.message)) {
    // expected error from enterpriseUploadAsset, ignore
    return
  }

  console.log(error)
  process.exit(1)
})
