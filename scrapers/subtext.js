const { chromium } = require('playwright');
const countryInfo = require('get-all-country-info');
const updateDb = require('../productsDb');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto("https://www.subtext.coffee/collections/filter-coffee-beans/");
  const hrefs = await getProductLinks(page);
  const products = await getProductData(page, hrefs);
  await browser.close();
  const brand = 'Subtext';
  await updateDb(products, brand);
})();

async function getProductLinks(page) {
  return await page.evaluate(() => {
    let links = [];
    Array.from(document.links).map((item) => {
      if (item.href.includes('products') && !item.href.includes('subscription') && !item.href.includes('decaf')) {
        links.push(item.href);
      }
    });
    links = [...new Set(links)];
    return links;
  });
}

async function getProductData(page, hrefs) {
  let products = [];
  const brand = 'Subtext';
  for (const link of hrefs) {
    await page.goto(link);
    const title = await getTitle(page);
    const price = await getPrice(page);
    const weight = await getWeight(page);
    const process = await getProcess(page);
    const process_category = getProcessCategory(process);
    const variety = await getVariety(page);
    const country = await getCountry(page);
    const continent = countryInfo.getContinentName(country);
    const product_url = link;
    const image_url = await getImageUrl(page);
    const sold_out = (price === '0.00' ? true : false);
    const date_added = new Date().toISOString();
    const product = {
      brand,
      title,
      price,
      weight,
      process,
      process_category,
      variety,
      country,
      continent,
      product_url,
      image_url,
      sold_out,
      date_added
    };
    products.push(product);
  }
  console.log(products);
  return products;
}

async function getImageUrl(page) {
  return await page.$eval('.shogun-image', (el) => el.src);
}

async function getTitle(page) {
  const pageHeaders = await page.$$eval('.shogun-heading-component', (nodes) => nodes.map((n) => n.innerText));
  return pageHeaders[1];
}

async function getCountry(page) {
  return await page.$eval('.shogun-heading-component', (el) => el.innerText);
}

async function getPrice(page) {
  return await page.$eval('.shg-product-price', (el) => el.innerText.substring(1));
}

async function getWeight(page) {
  const weight = await page.$$eval('option', (nodes) => nodes.map((n) => n.innerText));
  return Number(weight[0].slice(0, -1));
}

async function getProcess(page) {
  const specs = await page.$$eval('p', (nodes) => nodes.map((n) => n.innerText));
  let process = '';
  for (const info of specs) {
    if (info.includes('Process')) {
      process = info.split('Process');
      process = process[process.length - 1].trim();
    }
  };
  return process;
}

function getProcessCategory(process) {
  if (process === 'Washed' || process === 'Natural' || process === 'Honey') {
    return process;
  }
  return 'Experimental';
}

async function getVariety(page) {
  const specs = await page.$$eval('p', (nodes) => nodes.map((n) => n.innerText));
  let varietyList = [];
  for (const info of specs) {
    if (info.includes('Varieties')) {
      let varieties = info.split('Varieties');
      varieties = varieties[varieties.length - 1].trim();
      if (varieties.includes('&')) {
        varietyList = varieties.split(' & ');
      } else {
        varietyList.push(varieties);
      }
      varietyList.forEach((variety, i) => {
        if (variety === 'V. Colombia') {
          varietyList[i] = 'Colombia';
        }
      });
    }
  }
  return varietyList;
}