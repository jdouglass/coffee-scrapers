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
      if (item.href.includes('products') && !item.href.includes('subscription') && !item.href.includes('decaf') && !item.href.includes('nitro')) {
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
    const price = getPrice(axiosData[i].variants);
    const weight = getWeight(axiosData[i].variants);
    const process = await getProcess(page);
    const process_category = getProcessCategory(process);
    const variety = await getVariety(page);
    const country = getCountry(axiosData[i].title);
    const continent = getContinent(country);
    const product_url = hrefs[i];
    const image_url = getImageUrl(axiosData[i].images);
    const sold_out = getSoldOut(axiosData[i].variants);
    const date_added = getDateAdded(axiosData[i]);
    const title = getTitle(axiosData[i].title, country);
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
    console.log(product);
  }
  return products;
}

function getImageUrl(item) {
  let lastItem = item.pop();
  return lastItem.src;
}

function getTitle(item, country) {
  item = item.split(country)[1];
  return item.split(',')[0].trim();
}

function getCountry(item) {
  item = item.toLowerCase();
  for (const name of worldData.worldData) {
    let lowerCaseCountry = name.country.toLowerCase();
    if (item.includes(lowerCaseCountry)) {
      return name.country;
    }
  }
  return '';
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

function getWeight(item) {
  const weight = item.map((variant) => {
    if (variant.available) {
      return variant.grams;
    }
  })
  if (weight.includes(undefined)) {
    return item[0].grams;
  }
  return weight[0];
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