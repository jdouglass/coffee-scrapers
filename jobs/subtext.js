const { chromium } = require('playwright');
const worldData = require('../worldData');
const updateDb = require('../productsDb');
const axios = require('axios');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const jsonLink = "https://www.subtext.coffee/collections/filter-coffee-beans/products.json?limit=250";
  let res = await axios.get(jsonLink);
  res = res.data.products;
  let axiosData = [];
  res = res.map((item) => {
    if (!item.title.includes('Subscription') && !item.title.includes('Decaf')) {
      axiosData.push(item);
    }
  })
  const baseUrl = "https://www.subtext.coffee/collections/filter-coffee-beans/";
  await page.goto(baseUrl);
  const hrefs = await getProductLinks(page);
  const products = await getProductData(page, hrefs, axiosData);
  await browser.close();
  const vendor = 'Subtext';
  await updateDb(products, vendor);
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

async function getProductData(page, hrefs, axiosData) {
  let products = [];
  const brand = 'Subtext';
  const vendor = brand;
  for (let i = 0; i < hrefs.length; i++) {
    await page.goto(hrefs[i]);
    const title = await getTitle(page);
    const price = getPrice(axiosData[i].variants);
    const weight = await getWeight(page);
    const process = await getProcess(page);
    const process_category = getProcessCategory(process);
    const variety = await getVariety(page);
    const country = await getCountry(page);
    const continent = getContinent(country);
    const product_url = hrefs[i];
    const image_url = await getImageUrl(page);
    const sold_out = getSoldOut(axiosData[i].variants);
    const date_added = getDateAdded(axiosData[i]);
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
      date_added,
      vendor
    };
    products.push(product);
  }
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

function getContinent(country) {
  for (const name of worldData.worldData) {
    if (country === name.country) {
      return name.continent;
    }
  }
}

function getPrice(item) {
  const price = item.map((variant) => {
    if (variant.available) {
      return variant.price;
    }
  })
  if (!price.includes(undefined)) {
    return price[0];
  }
  return item[0].price;
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

function getSoldOut(item) {
  let sold_out = true;
  item.forEach((variant) => {
    if (variant.available) {
      sold_out = false;
    }
  })
  return sold_out;
}

function getDateAdded(item) {
  return new Date(item.published_at).toISOString();
}