const countryInfo = require('get-all-country-info');
const axios = require('axios');
const updateDb = require('../productsDb');

(async () => {
  const jsonLink = "https://piratesofcoffee.com/collections/coffee/products.json"
  const products = await getProductData(jsonLink);
  const brand = 'Pirates of Coffee';
  await updateDb(products, brand);
})();

async function getProductData(jsonLink) {
  const brand = 'Pirates of Coffee';
  let products = [];
  let res = await axios.get(jsonLink);
  res = res.data.products;
  const baseUrl = "https://piratesofcoffee.com/collections/coffee";
  res.forEach((item) => {
    if (!item.title.includes('Sample') && !item.title.includes('Panama Ninety Plus Estates') && !item.title.includes('TREASURE BOX') && !item.title.includes('Subscription') && !item.title.includes('Blend')) {
      const title = getTitle(item);
      const price = getPrice(item.variants);
      const weight = getWeight(item.variants);
      const process = getProcess(item.body_html);
      const process_category = getProcessCategory(process);
      const variety = getVariety(item.body_html);
      const country = getCountry(item);
      const continent = countryInfo.getContinentName(country);
      const product_url = getProductUrl(item, baseUrl);
      const image_url = getImageUrl(item);
      const sold_out = getSoldOut(item.variants);
      const date_added = getDateAdded(item);
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
  })
  console.log(products);
  return products;
}

function getTitle(item) {
  let title = item.title;
  title = title.split(':')[0];
  title = title.split(' ');
  title = title.map((word) => {
    return word[0] + word.substring(1).toLowerCase();
  })
  return title.join(' ');
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

function getProcess(item) {
  let process = item.split('Process:')[1];
  process = process.split('<');
  process = process[0].trim();
  if (process === 'Anaerobic Natural Process') {
    return 'Anaerobic Natural';
  }
  return process;
}

function getProcessCategory(process) {
  if (process === 'Washed' || process === 'Natural' || process === 'Honey') {
    return process;
  }
  return 'Experimental';
}

function getVariety(item) {
  let variety = [];
  if (item.includes('Varietal:')) {
    variety = item.split('Varietal:')[1];
  } else {
    variety = item.split('Variety:')[1];
  }
  variety = variety.split('<');
  variety = variety[0].trim();
  if (variety.includes('Ethiopian Landrace')) {
    return ['Ethiopian Landrace']
  }
  if (variety.includes(' / ')) {
    variety = variety.split(' / ');
    variety = variety.map((word) => {
      return word[0] + word.substring(1).toLowerCase();
    })
  }
  if (variety.includes(', ')) {
    variety = variety.split(', ');
    variety = variety.map((word) => {
      if (word.includes(' ')) {
        word = word.split(' ');
        word = word.map((varietyWord) => {
          return varietyWord[0] + varietyWord.substring(1).toLowerCase();
        })
        return word.join(' ');
      }
      return word[0] + word.substring(1).toLowerCase();
    })
  }
  if (!Array.isArray(variety)) {
    variety = variety.split(' ');
    variety = variety.map((word) => {
      if (word !== 'AND') {
        return word[0] + word.substring(1).toLowerCase();
      }
      return word.toLowerCase();
    })
  }
  variety = variety.map((word) => {
    if (word === 'Sl14') {
      return 'SL14';
    }
    if (word === 'Sl28') {
      return 'SL28';
    }
    if (word === 'Sl34') {
      return 'SL34';
    }
    return word;
  })
  if (variety.includes('and')) {
    return [variety[variety.length-1]];
  }
  if (variety.includes('Various')) {
    return ['Blend']
  }
  return variety;
}

function getCountry(item) {
  let country = '';
  if (item.body_html.includes('Single origin from ')) {
    country = item.body_html.split('Single origin from ')[1];
  } else if (item.body_html.includes('Single Origin from ')) {
    country = item.body_html.split('Single Origin from ')[1];
  } else if (item.title.includes('FRUIT PUNCH: Ethiopia')) {
    return 'Ethiopia';
  }
  if (item.title.includes('Indonesia') || item.title.includes('INDONESIA')) {
    return 'Indonesia';
  }
  if (item.title.includes('N33')) {
    return 'Panama';
  }
  country = country.split('<')[0];
  country = country.trim();
  if (country === 'TIMOR-LESTE') {
    return 'East Timor';
  }
  if (country.includes('Ethiopia')) {
    return 'Ethiopia';
  }
  if (country.includes('Brazil')) {
    return 'Brazil';
  }
  return country;
}

function getProductUrl(item, baseUrl) {
  return baseUrl + '/products/' + item.handle;
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