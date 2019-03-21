const puppet = require('./puppet.js');

let url;

const log = console.log;

async function main(_url) {
  let page = await puppet.loadPage(_url);

  log('SW Details');
  console.group();

  let swSupported = await puppet.isSWSupported(page);
  log(`swSupported:\t\t${swSupported}`);

  let pageControlled = await puppet.isPageControlled(page);
  log(`pageControlled:\t\t${pageControlled}`);

  let swScope = await puppet.getSWScope(page);
  log(`swScope:\t\t${swScope}`);

  let skipWaiting = await puppet.isSkipWaiting(page);
  log(`skipWaiting:\t\t${skipWaiting}`);

  console.groupEnd();

  let precacheList = await puppet.getPrecacheList(page);
  Object.keys(precacheList).forEach(key => {
  	log();
  	log(`Precache list for cache '${key}':`);
  	console.group();
  	precacheList[key].forEach(url => {
  		log(url);
  	});
  	console.groupEnd();
  })
}

process.argv.forEach((arg, index) => {
  if (process.argv[index] === '--url') {
    url = process.argv[index + 1];
  }
});

if (url) {
  main(url);
} else {
  console.log("Must provide a url parameter. Example:");
  console.log("node main.js --url https://www.example.com");
}