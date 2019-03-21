const puppeteer = require('puppeteer');
const devices = require('puppeteer/DeviceDescriptors');
const phone = devices['Nexus 5X'];

const HEADLESS = false;
const DEV_TOOLS = true;
const PAGE_WAIT_MS = 2 * 1000;
const PAGE_TIMEOUT_MS = 20 * 1000;

const log = console.log;

async function loadPage(url, offline = false) {
  let page = await createCDPSession();

  await page.goto(url, {
    waitUntil: 'networkidle2',
    timeout: PAGE_TIMEOUT_MS
  }).catch(() => {
    log("There was an error in first view");
  });

  log(`Waiting for SW ready event...`);
  await page.evaluate('navigator.serviceWorker.ready');
  log(`SW ready`);
  log();

  await page.waitFor(PAGE_WAIT_MS);

  return page;
}

async function createCDPSession() {
  const browser = await puppeteer.launch({
    headless: HEADLESS,
    devtools: DEV_TOOLS
  });

  const page = await browser.newPage();
  await page.emulate(phone);
  await page.setCacheEnabled(false);

  // TODO: remove
  // const client = await page.target().createCDPSession();
  // await client.send('ServiceWorker.enable');
  // await client.send('Network.clearBrowserCache');
  // await client.send('Network.setCacheDisabled', { 'cacheDisabled': true });

  return page;
}

async function isSWSupported(page) {
  return await page.evaluate(`'serviceWorker' in navigator`);
}

async function isPageControlled(page) {
  return (await page.evaluate(`navigator.serviceWorker.controller`)) ? true : false;
}

async function getSWState(page) {
  return await page.evaluate(`navigator.serviceWorker.controller.state`);
}

async function isSkipWaiting(page) {
  return (await page.evaluate(`navigator.serviceWorker.getRegistration()
    .then(reg => reg.update())
    .then(update => { return update.waiting ? false : true; });`));
}

async function getSWScope(page) {
  return page.evaluate(`
    navigator.serviceWorker.getRegistrations().then(function(regs) {if(regs && regs.length>0) return regs[0].scope})`);
}

async function getPrecacheList(page) {
  let cacheNames = await page.evaluate(`caches.keys()`);
  let precacheList = {};

  for (let i = 0; i < cacheNames.length; i++) {
    let cacheName = cacheNames[i];
    let keys = await page.evaluate(`
      caches.open('${cacheName}')
        .then(cache => cache.keys())
        .then(keys => {
          let urls = [];
          keys.forEach(key => {
            urls.push(key.url);
          });
          return urls;
        });`);
    precacheList[cacheName] = keys;
  }

  return precacheList;
}

module.exports = {
  loadPage,
  isSWSupported,
  isPageControlled,
  getSWState,
  isSkipWaiting,
  getSWScope,
  getPrecacheList
};