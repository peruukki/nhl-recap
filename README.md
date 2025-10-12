# nhl-recap

A web app playing back the goal information from the latest NHL games. I made this to have a more exciting way of checking
the scores while I brush my teeth in the morning, as the games are usually played at night time in Finland.

The app is running at https://peruukki.github.io/nhl-recap/. Add it to your home screen on an Android
or iOS device for a more app-like, chromeless experience.

By default, the app shows the latest scores, but you can also specify a custom date with the `date` URL search parameter,
for example https://peruukki.github.io/nhl-recap/?date=2025-06-17. The date needs to be in `YYYY-MM-DD` format.

Built with [Cycle.js](https://cycle.js.org/) and `npm` scripts. Uses [nhl-score-api](https://github.com/peruukki/nhl-score-api)
as its backed.

https://github.com/peruukki/nhl-recap/assets/1781172/ee217216-da23-42b3-8798-6f46e4bc23b7

## Running the app

To run the app and re-build on file changes:

```shell
npm start
```

The app is available at http://localhost:8008/nhl-recap/, and the command should open a browser automatically.

### Running a production build

To create a production build and preview it locally:

```shell
npm run start:production
```

### Running the app against local API server

To run the app connecting to a local [nhl-score-api](https://github.com/peruukki/nhl-score-api) server on port 8080:

```shell
npm run start:local
```

Instead of a real `nhl-score-api` server, you can also start a mock [json-server](https://github.com/typicode/json-server)
API server that returns a static response from the [`server/db.json`](server/db.json) file:

```shell
npm run start:server
```

Then you can run the app connecting to the local server with `npm run start:local` as described above.

## Component gallery

This project has its own poor person’s component gallery that currently just shows the game component in all
its possible states, so that you don’t need to play back games in different states to see them.

The gallery is available at http://localhost:8008/nhl-recap/gallery/ when running the development server locally. (Note
that the trailing slash is required.)

## Formatting with Prettier

JavaScript is formatted using [Prettier](https://prettier.io/). Prettier is the most convenient to run via your IDE,
but it is also run as part of the linting tasks:

```shell
npm run format
```

## Running all source code checks

Lint SASS and JavaScript/TypeScript, type-check TypeScript, verify code formatting and run unit tests:

```shell
npm run check
```

## Linting

### Linting JavaScript/TypeScript

One-time lint run:

```shell
npm run lint:js
```

### Linting SASS

I'm trying out the [BEM (Block-Element-Modifier)](http://getbem.com/introduction/) [naming convention](http://getbem.com/naming/)
in this project.

The lint scripts have a `css` suffix (instead of `sass` that you might expect) for uniformity with the other CSS related scripts.

One-time lint run:

```shell
npm run lint:css
```

Lint on file changes:

```shell
npm run watch:lint:css
```

## Testing

Run unit tests:

```shell
npm test
```

Run unit tests, including coverage:

```shell
npm run test:coverage
```

Run unit tests in watch mode:

```shell
npm run test:watch
```

## Building

Build the app to the `public` directory:

```shell
npm run build
```

## Deployment

Deployments to GitHub Pages are done by running the [Deployment workflow](https://github.com/peruukki/nhl-recap/actions/workflows/deployment.yml).

### Alternative deployment method

The `deploy` script will build the app, clone the `gh-pages` branch to the `dist` directory, copy the build there,
create a commit, and push the commit to the `gh-pages` branch in `origin`.

Usual deployment process:

```shell
# Bump version
npm version <major|minor|patch>
# Deploy to GitHub Pages
npm run deploy
# Push to Git
git push origin master --tags
```

## License

[MIT](LICENSE)

## Acknowledgements

This project has been a grateful recipient of the
[Futurice Open Source sponsorship program](https://www.futurice.com/blog/sponsoring-free-time-open-source-activities/?utm_source=github&utm_medium=spice).
