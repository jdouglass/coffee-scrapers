const worldData = require('../worldData');
const updateDb = require('../productsDb');
const axios = require('axios');

(async () => {
  const jsonLink = "https://piratesofcoffee.com/collections/coffee/products.json?limit=250"
  const products = await getProductData(jsonLink);
  const vendor = 'Pirates of Coffee';
  await updateDb(products, vendor);
})();

async function getProductData(jsonLink) {
  const brand = 'Pirates of Coffee';
  const vendor = brand;
  let products = [];
  let res = await axios.get(jsonLink);
  res = res.data.products;
  const baseUrl = "https://piratesofcoffee.com/collections/coffee";
  res.forEach((item) => {
    if (!item.title.includes('Sample') && !item.title.includes('Panama Ninety Plus Estates') && !item.title.includes('TREASURE BOX') && !item.title.includes('Subscription') && !item.title.includes('Blend') && !item.title.includes('BAGS')) {
      const title = getTitle(item);
      const price = getPrice(item.variants);
      const weight = getWeight(item.variants);
      const process = getProcess(item.body_html);
      const process_category = getProcessCategory(process);
      const variety = getVariety(item.body_html);
      const country = getCountry(item);
      const continent = getContinent(country);
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
        date_added,
        vendor
      };
      products.push(product); 
    }
  })
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
    if (word === 'Geisha') {
      return 'Gesha';
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
  let reportBody = item.body_html.split('Single ')[1];
  reportBody = reportBody.split('<')[0];
  for (const name of worldData.worldData) {
    if (item.title.includes(name.country)) {
      country = name.country;
      return country;
    } else if (reportBody.includes(name.country)) {
      country = name.country;
      return country;
    }
  }
  return country;
}

function getContinent(country) {
  for (const name of worldData.worldData) {
    if (country === name.country) {
      return name.continent;
    }
  }
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