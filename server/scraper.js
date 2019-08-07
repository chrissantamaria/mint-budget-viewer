const puppeteer = require('puppeteer-core');
const querystring = require('querystring');
const path = require('path');
const csv = require('csvtojson');
const fs = require('fs').promises;

const getTransactions = async () => {
  await downloadTransactions();
  return await parseAndSaveTransactions();
};

const downloadTransactions = async () => {
  let browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: [
      '--app=https://mint.intuit.com/overview.event',
      '--window-size=500,600'
    ],
    executablePath: process.env.CHROME_EXECUTABLE_PATH
  });
  let [page] = await browser.pages();

  await page.waitForSelector('#ius-sign-in-wrapper');
  console.log('Reached sign in');
  // Waiting for successful user authentication
  await page.waitForSelector('#body-mint', { timeout: 0 });
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

const parseAndSaveTransactions = async () => {
  const csvPath = path.join(__dirname, '../data/transactions.csv');
  let transactions = await csv().fromFile(csvPath);
  console.log(`Read ${transactions.length} transactions from downloaded CSV`);
  // Not awaiting, no need to block
  fs.unlink(csvPath);

  transactions = transactions.map(row => ({
    date: new Date(row.Date),
    description: row.Description,
    amount: parseFloat(row.Amount)
  }));

  const fileData = {
    data: transactions,
    lastUpdated: new Date().toISOString()
  };
  await fs.writeFile(
    path.join(__dirname, '../data/transactions.json'),
    JSON.stringify(fileData, null, 2)
  );

  return fileData;
};

module.exports = {
  getTransactions
};
