const { getExecutablePath } = require('./server/chrome-helpers');
const { getTransactions } = require('./server/scraper');

(async () => {
  if (!process.env.CHROME_EXECUTABLE_PATH) {
    process.env.CHROME_EXECUTABLE_PATH = await getExecutablePath({
      // useLocalChromium: true
    });
  }

  await getTransactions();
  console.log('Successfully fetched transactions from Mint');
})().catch(console.error);
