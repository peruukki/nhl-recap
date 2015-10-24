module.exports.config = {
  npm: {
    enabled: true
  },

  files: {
    javascripts: {
      joinTo: 'app.js'
    }
  },

  plugins: {
    babel: {
      pattern: /\.(js|jsx)$/
    }
  }
}
