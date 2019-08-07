const carlo = require('carlo');
const path = require('path');
const fs = require('fs').promises;

const { getExecutablePath } = require('./server/chrome-helpers');
const { getTransactions } = require('./server/scraper');

const server = require('http').createServer();
const io = require('socket.io')(server);

(async () => {
  if (!process.env.CHROME_EXECUTABLE_PATH) {
    process.env.CHROME_EXECUTABLE_PATH = await getExecutablePath({
      // useLocalChromium: true
    });
  }

  // await getTransactions();
  let transactions = JSON.parse(
    await fs.readFile(path.join(__dirname, 'data/transactions.json')),
    'utf8'
  );
  console.log(`Loaded ${transactions.data.length} transactions`);

  io.on('connection', socket => {
    socket.emit('transactions', transactions);

    const logStatus = message => {
      console.log(message);
      socket.emit('transactionsStatus', message);
    };

    socket.on('getTransactions', async () => {
      console.log('Client requested new transactions');
      socket.emit('transactionsLoading', true);
      try {
        transactions = await getTransactions({ logStatus });
        socket.emit('transactions', transactions);
      } catch (e) {
        // Occurs when Puppeteer is closed
        if (
          e.message ===
          'Protocol error (Runtime.callFunctionOn): Target closed.'
        ) {
          logStatus('Get transactions process cancelled');
        } else {
          logStatus(`Error: ${e.message}`);
        }
      }
      socket.emit('transactionsLoading', false);
    });
  });

  server.listen(4200);

  await launchCarlo();
})().catch(console.error);

const launchCarlo = async () => {
  const app = await carlo.launch({
    executablePath: process.env.CHROME_EXECUTABLE_PATH
  });

  app.on('exit', () => process.exit());

  if (process.env.NODE_ENV === 'development') {
    await app.load('http://localhost:3000/');
  } else {
    app.serveFolder(path.join(__dirname, 'build'));
    await app.load('index.html');
  }
};
