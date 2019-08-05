const { getExecutablePath } = require('./server/chrome-helpers');
const { getTransactions } = require('./server/scraper');

(async () => {
  const executablePath = await getExecutablePath({
    // useLocalChromium: true
  });

  await getTransactions({ executablePath });
  console.log('Successfully fetched transactions from Mint');
})().catch(console.error);
