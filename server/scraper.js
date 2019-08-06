const puppeteer = require('puppeteer-core');
const querystring = require('querystring');
const path = require('path');
const csv = require('csvtojson');
const fs = require('fs').promises;

const getTransactions = async () => {
  await downloadTransactions();
  await parseTransactions();
};

const downloadTransactions = async () => {
  let browser = await puppeteer.launch({
    headless: false,
    args: [
      '--app=https://mint.intuit.com/overview.event',
      '--window-size=500,600'
    ],
    executablePath: process.env.CHROME_EXECUTABLE_PATH
  });
  let [page] = await browser.pages();
  await page.setViewport({ width: 500, height: 600 });

  await page.waitForSelector('#ius-sign-in-wrapper');
  console.log('Reached sign in');
  // Waiting for successful user authentication
  await page.waitForSelector('#body-mint');
  console.log('Logged in');

  const cookies = await page.cookies();
  console.log(`Saved ${cookies.length} cookies`);
  await browser.close();

  // Launching new headless browser for scraping
  browser = await puppeteer.launch({
    // headless: false,
    // defaultViewport: null,
    executablePath: process.env.CHROME_EXECUTABLE_PATH
  });
  [page] = await browser.pages();
  await page.setCookie(...cookies);

  // Example Mint query options, will be changed later through frontend UI
  const query = querystring.stringify({
    query: 'category:"food & dining"',
    startDate: '05/28/2019',
    endDate: '08/30/2019',
    exclHidden: 'T'
  });
  await page.goto(`https://mint.intuit.com/transaction.event?${query}`);
  await page.waitForSelector('#transactionExport');
  console.log('Reached transactions page');

  // Waiting until Mint transactions are loaded
  // (checking for .loading class every 300ms)
  await page.evaluate(async () => {
    await new Promise(resolve => {
      const loop = setInterval(() => {
        if (!document.querySelectorAll('.loading').length) {
          clearInterval(loop);
          resolve();
        }
      }, 300);
    });
  });
  console.log('Mint finished loading transactions');

  await page._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: path.join(__dirname, '../data')
  });
  await Promise.all([
    page.click('#transactionExport'),
    // Waiting for CSV download response
    page.waitForResponse(req =>
      req.url().includes('https://mint.intuit.com/transactionDownload.event')
    )
  ]);
  console.log('CSV downloaded, closing browser');

  browser.close();
};

const parseTransactions = async () => {
  let transactions = await csv().fromFile(
    path.join(__dirname, '../data/transactions.csv')
  );
  console.log(`Read ${transactions.length} transactions from downloaded CSV`);

  transactions = transactions.map(row => ({
    date: new Date(row.Date),
    description: row.Description,
    amount: parseFloat(row.Amount)
  }));

  const data = { transactions, lastUpdated: new Date().toISOString() };
  await fs.writeFile(
    path.join(__dirname, '../data/transactions.json'),
    JSON.stringify(data, null, 2)
  );
};

module.exports = {
  getTransactions
};
