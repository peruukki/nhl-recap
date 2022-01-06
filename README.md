# nhl-recap

[![Build Status](https://travis-ci.org/peruukki/nhl-recap.svg?branch=master)](https://travis-ci.org/peruukki/nhl-recap)

A web app playing back the goal information from the latest NHL games. I made this to have a more exciting way of checking
the scores while I brush my teeth in the morning, as the games are usually played at night time in Finland.

The app is running at [GitHub pages](https://peruukki.github.io/nhl-recap/). Add it to your home screen on an Android
or iOS device for a more app-like, chromeless experience.

Built with [Cycle.js](https://cycle.js.org/) and `npm` scripts. Uses [nhl-score-api](https://github.com/peruukki/nhl-score-api)
as its backed.

## Running the app

To run the app and re-build on file changes:

```
npm start
```

Open http://localhost:8008/ in your browser once you see a message like this in the terminal:

```
1087061 bytes written to public/main.js (5.39 seconds) at 5:59:06 PM
```

## Running the app with local API server

To run the app connecting to a local [nhl-score-api](https://github.com/peruukki/nhl-score-api) server on port 8080:

```
npm run start:local
```

Instead of a real `nhl-score-api` server, you can also start a mock [json-server](https://github.com/typicode/json-server)
API server that returns a static response from the [`server/db.json`](server/db.json) file:

```
npm run start:server
```

Then you can run the app connecting to the local server with `npm run start:local` as described above.

## Component gallery

This project has its own poor person’s component gallery that currently just shows the game component in all
its possible states, so that you don’t need to play back games in different states to see them.

To see the gallery, first start the development server as described above, then run this in another terminal:

```
npm run start:gallery
```

Open http://localhost:8008/gallery.html in your browser once you see a message like this in the terminal:

```
806766 bytes written to public/main-gallery.js (0.24 seconds) at 7:48:36 PM
```

## Formatting with Prettier

JavaScript is formatted using [Prettier](https://prettier.io/). Prettier is the most convenient to run via your IDE,
but it is also run as part of the linting tasks:

```
npm run lint:format
```

## Linting JavaScript

One-time lint run:

```
npm run lint:js
```

Lint on file changes:

```
npm run watch:lint:js
```

## Linting SASS

I'm trying out the [BEM (Block-Element-Modifier)](http://getbem.com/introduction/) [naming convention](http://getbem.com/naming/)
in this project.

The lint scripts have a `css` suffix (instead of `sass` that you might expect) for uniformity with the other CSS related scripts.

One-time lint run:

```
npm run lint:css
```

Lint on file changes:

```
npm run watch:lint:css
```

## Testing

Lint SASS, lint JavaScript, run Prettier and run unit tests:

```
npm test
```

## Building

Build the app to the `public` directory:

```
npm run build
```

## Publishing the app on GitHub pages

The `publish` script will build the app, clone the `gh-pages` branch to the `dist` directory, copy the build there,
create a commit, and push the commit to the `gh-pages` branch in `origin`:

```
npm run publish
```

## Generating SVG icon data with different fill colors

The `app/icons` directory contains SVG icons with a placeholder fill color `${fillColor}`. The `generate-svg-data.js`
script takes a filename and fill color and generates URI encoded SVG data that can be used in a `background-image` CSS
declaration. This helps to generate differently colored versions of the same icon, for example for different button
states.

You can use the `svg` `npm` script to generate the SVG data, for example:

```
npm run svg play.svg '#D0D1E2'
```

## License

[MIT](LICENSE)

## Acknowledgements

This project has been a grateful recipient of the
[Futurice Open Source sponsorship program](https://www.futurice.com/blog/sponsoring-free-time-open-source-activities/?utm_source=github&utm_medium=spice).
