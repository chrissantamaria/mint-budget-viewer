# Mint Budget Viewer

A web scraper for the personal finance platform Mint with a dynamic UI for displaying data. Uses [Carlo](https://github.com/GoogleChromeLabs/carlo) for displaying the React frontend and [Puppeteer](https://www.npmjs.com/package/puppeteer-core) for scraping.

This project is still in development and is fairly bare as-is - feel free to submit an issue to request a specific feature (data display, additional scraping, etc).

Requires Node 10+ for `fs` Promises support (can be replaced with something like [fs-extra](https://github.com/jprichardson/node-fs-extra)) and Yarn.

## Usage

Install dependencies (not including a local copy of Chromium)

```
yarn
```

Build the frontend

```
yarn build
```

Run the app

```
yarn start
```

This will start the Carlo-based frontend from which the Puppeteer scraper can be triggered.

## Development

Start a React development server

```
yarn run dev:client
```

Start a Nodemon development server (also sets `NODE_ENV=development` so Carlo will display `localhost:3000` rather than the `build` folder)

```
yarn run dev:server
```

Run both as a single task

```
yarn run dev
```

## Features

- Prefers existing Chrome installation for frontend + scraping (downloads local Chromium build to `node_modules` if necessary)
- "Refresh Transactions" button to trigger new scrape of Mint data
- Realtime status messages of scraping process
- Filtering transactions by type and date (currently hardcoded into Mint query, can be added to frontend)

## Todo / Known bugs

- Handle `transactions.json` not existing on launch (currently throws error)
- Do something meaningful with data on frontend

## Notes

For a more in-depth explanation of how Carlo + Puppeteer are used in this project, see [carlo-puppeteer-example](https://github.com/chrissantamaria/carlo-puppeteer-example).

Parsed transactions are saved to the `data` folder as `transactions.json`. Raw transactions from Mint are also downloaded to `data` as `transactions.csv` but should be deleted after being parsed.

`socket.io` is used for realtime client-server communication (sending new transactions, scraping status, etc).
