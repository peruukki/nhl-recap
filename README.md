# nhl-recap

A web app showing the latest NHL scores fetched from [nhl-score-api](https://github.com/peruukki/nhl-score-api). Built
with [Cycle.js](http://cycle.js.org/) and `npm` scripts.

The app is not very impressive (yet?), but it’s available at
[GitHub pages](http://peruukki.github.io/nhl-recap/) nonetheless.


## Running the app

To run the app and re-build on file changes:
```
npm start
```

## Linting JavaScript

One-time lint run:
```
npm run lint
```

Lint on file changes:
```
npm run lint-watch
```

## Building

Build the app to the `public` directory:
```
npm run build
```

## Publishing the app on GitHub pages

The `publish` script will build the app, clone the `gh-pages` branch to the `dist` directory, copy the build there,
and create a commit, ready to be pushed:
```
npm run publish
```

## License

[MIT](LICENSE)

## Acknowledgements

This project is a grateful recipient of the
[Futurice Open Source sponsorship program](http://futurice.com/blog/sponsoring-free-time-open-source-activities?utm_source=github&utm_medium=spice).
