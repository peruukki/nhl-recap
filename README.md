# nhl-scores

A web app showing the latest NHL scores fetched from [nhl-score-api](https://github.com/peruukki/nhl-score-api).

The app is not very impressive (yet?), but it’s available at
[GitHub pages](http://peruukki.github.io/nhl-scores/) nonetheless.

## Main libraries used

- [Brunch](http://brunch.io/) and npm scripts as build tools
- [React.js](http://facebook.github.io/react/) as the UI library

## Running the app

To run the app and re-build on file changes:
```
npm start
```

The script doesn’t lint the JavaScript because I couldn’t get the
[ESLint Brunch plugin](https://github.com/spyl94/eslint-brunch) to use the
[ESLint React plugin](https://github.com/yannickcr/eslint-plugin-react).

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
