module.exports.config = {
  npm: {
    enabled: true
  },

  files: {
    javascripts: {
      joinTo: 'app.js'
    },
    stylesheets: {
      joinTo: 'app.css'
    }
  },

  plugins: {
    babel: {
      pattern: /\.(js|jsx)$/
    }
  }
}
