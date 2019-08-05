const puppeteer = require('puppeteer-core');
const querystring = require('querystring');

const getTransactions = async ({ executablePath }) => {
  let browser = await puppeteer.launch({
    headless: false,
    args: [
      '--app=https://mint.intuit.com/overview.event',
      '--window-size=500,600'
    ],
    executablePath
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
  browser = await puppeteer.launch({ executablePath });
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

  await page._client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath: __dirname
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

module.exports = {
  getTransactions
};
