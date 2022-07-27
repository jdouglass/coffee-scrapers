const { chromium } = require('playwright');
const worldData = require('../worldData');
const axios = require('axios');
const updateDb = require('../productsDb');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();
  const jsonLink = "https://www.roguewavecoffee.ca/collections/coffee/products.json";
  let res = await axios.get(jsonLink);
  res = res.data.products;
  let axiosData = [];
  res = res.map((item) => {
    if (!item.title.includes('Garage') && !item.title.includes('Decaf') && !item.title.includes('Pack') && !item.title.includes('Surprise') && !item.title.includes('Dried Coffee')) {
      axiosData.push(item);
    }
  })
  const baseUrl = "https://www.roguewavecoffee.ca/collections/coffee/";
  await page.goto(baseUrl);
  const hrefs = await getProductLinks(page);
  const products = await getProductData(page, hrefs, axiosData, baseUrl);
  await browser.close();
  const vendor = 'Rogue Wave';
  await updateDb(products, vendor);
})();

async function getProductLinks(page) {
  return await page.evaluate(() => {
    let links = [];
    Array.from(document.links).map((item) => {
      if (item.href.includes('/coffee/products/') && !item.href.includes('garage') && !item.href.includes('decaf') && !item.href.includes('pack') && !item.href.includes('surprise') && !item.href.includes('dried-coffee')) {
        links.push(item.href);
      }
    });
    links = [...new Set(links)];
    return links;
  });
}

async function getProductData(page, hrefs, items, baseUrl) {
  const brand = 'Rogue Wave';
  const vendor = brand;
  let products = [];
  for (let i = 0; i < hrefs.length; i++) {
    await page.goto(hrefs[i]);
    const price = getPrice(items[i].variants);
    const weight = getWeight(items[i].variants);
    const process = await getProcess(items[i], page);
    const process_category = getProcessCategory(process);
    const variety = await getVariety(page);
    const country = getCountry(items[i]);
    const continent = getContinent(country);
    const product_url = getProductUrl(items[i], baseUrl);
    const image_url = getImageUrl(items[i]);
    const sold_out = getSoldOut(items[i].variants);
    const date_added = getDateAdded(items[i]);
    const title = getTitle(items[i], country);
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
  // console.log(products);
  return products;
}

function getTitle(item, country) {
  let title = item.title;
  title = title.replace(country, "");
  title = title.split('|')[0].trim();
  if (title.charAt(0) === "-") {
    title = title.substring(1);
  }
  if (title.charAt(title.length-1) === "-") {
    title = title.slice(0, -1);
  }
  return title.trim();
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
  let weight = 0;
  for (let i = 0; i < item.length; i++) {
    if (item[i].available) {
      weight = item[i].title;
      break;
    }
  }
  if (weight === 0) {
    weight = item[0].title;
  }
  if (weight.includes(' KG')) {
    weight = weight.split(' KG')[0];
    return weight.trim() * 1000;
  } else {
    return weight.slice(0, -1);
  }
}

async function getProcess(item, page) {
  let process = 'Unknown';
  let itemTitle = '';
  if (item.title.includes('|')) {
    itemTitle = item.title.split('|')[1];
  }
  if (!itemTitle.includes(' - ') && (itemTitle.includes('Honey') || itemTitle.includes('Natural') || itemTitle.includes('Washed'))) {
    return itemTitle.trim();
  }
  if (itemTitle.includes(' - ')) {
    itemTitle = itemTitle.split(' - ');
    for (let i = 0; i < itemTitle.length; i++) {
      if (itemTitle[i].includes('Honey') || itemTitle[i].includes('Natural') || itemTitle[i].includes('Washed')) {
        process = itemTitle[i].trim();
        break;
      }
    }
  }
  if (process !== 'Unknown') {
    return process.trim();
  }
  let itemBody = await page.innerText('.product-description');
  itemBody = itemBody.split('\n');
  for (let i = 0; i < itemBody.length; i++) {
    if (itemBody[i].includes('Process:')) {
      process = itemBody[i].replace("Process:", "");
      process = process.trim();
    }
  }
  return process.trim();
}

function getProcessCategory(process) {
  if (process === 'Washed' || process === 'Natural' || process === 'Honey') {
    return process;
  }
  return 'Experimental';
}

async function getVariety(page) {
  let variety = 'Unknown';
  let specs = await page.innerText('.product-description');
  specs = specs.split('\n');
  for (let i = 0; i < specs.length; i++) {
    if (specs[i].includes('Variety:')) {
      variety = specs[i].replace("Variety:", "");
      variety = variety.trim();
      break;
    } else if (specs[i].includes('Varieties:')) {
      variety = specs[i].replace("Varieties:", "");
      variety = variety.trim();
      break;
    }
  }
  if (!variety.includes(',') && !variety.includes('and') && !variety.includes('&')) {
    variety = variety.charAt(0).toUpperCase() + variety.substring(1);
    if (variety === 'Geisha') {
      return ['Gesha'];
    }
    return [variety];
  }
  if (variety.includes(',')) {
    variety = variety.split(',');
  } else if (variety.includes('and')) {
    variety = variety.split('and');
  } else if (variety.includes('&')) {
    variety = variety.split('&');
  }
  for (let i = 0; i < variety.length; i++) {
    variety[i] = variety[i].trim();
    variety[i] = variety[i].charAt(0).toUpperCase() + variety[i].substring(1);
    if (variety[i] === 'Geisha') {
      variety[i] = 'Gesha';
    }
  } 
  return variety;
}

function getCountry(item) {
  item = item.title.toLowerCase();
  for (const name of worldData.worldData) {
    let lowerCaseCountry = name.country.toLowerCase();
    if (item.includes(lowerCaseCountry)) {
      return name.country;
    }
  }
  let reportBody = item.body_html.split('Origin')[1];
  reportBody = reportBody.body_html.split('Region')[0];
  reportBody = reportBody.toLowerCase();
  for (const name of worldData.worldData) {
    let lowerCaseCountry = name.country.toLowerCase();
    if (reportBody.includes(lowerCaseCountry)) {
      return name.country;
    }
  }
  return 'Unknown';
}

function getContinent(country) {
  for (const name of worldData.worldData) {
    if (country === name.country) {
      return name.continent;
    }
  }
}

function getProductUrl(item, baseUrl) {
  return baseUrl + '/products/' + item.handle + '?variant=' + item.variants[0].id;
}

function getImageUrl(item) {
  return item.images[0].src;
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