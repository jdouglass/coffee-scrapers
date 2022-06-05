const countryInfo = require('get-all-country-info');
const axios = require('axios');
const updateDb = require('../productsDb');
const brandList = require('../brandList');

(async () => {
  const jsonLink = "https://revolvercoffee.ca/collections/coffee/products.json"
  const products = await getProductData(jsonLink);
  const merchant = 'Revolver Coffee';
  await updateDb(products, merchant);
})();

async function getProductData(jsonLink) {
  let products = [];
  let res = await axios.get(jsonLink);
  res = res.data.products;
  const baseUrl = "https://revolvercoffee.ca/collections/coffee";
  res.forEach((item) => {
    if (!item.title.includes('Sample') && !item.title.includes('Instant') && !item.title.includes('Decaf') && item.body_html.includes('Variet')) {
      const brand = getBrand(item);
      const price = getPrice(item.variants);
      const weight = getWeight(item.variants);
      const process = getProcess(item.body_html);
      const process_category = getProcessCategory(process);
      const variety = getVariety(item);
      const country = getCountry(item);
      const continent = countryInfo.getContinentName(country);
      const product_url = getProductUrl(item, baseUrl);
      const image_url = getImageUrl(item);
      const sold_out = getSoldOut(item.variants);
      const date_added = getDateAdded(item);
      const title = getTitle(item, brand, country);
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
  return products;
}

function getBrand(item) {
  let brand = '';
  brandList.brandList.forEach(brandName => {
    if (item.title.includes(brandName)) {
      brand = brandName
    }
  })
  return brand;
}

function getTitle(item, brand, country) {
  let title = item.title.split(brand)[1];
  title = title.split('*')[0];
  if (title.includes(country)) {
    title = title.replace(country, "");
  }
  if (title.includes('\"')) {
    title = title.replaceAll('\"', "");
  }
  if (title.includes('\'')) {
    title = title.replaceAll('\'', "");
  }
  if (title.includes('(')) {
    title = title.replaceAll('(', "");
  }
  if (title.includes(')')) {
    title = title.replaceAll(")", "")
  }
  title = title.trim();
  return title;
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
  if (process.includes(' + ')) {
    process = process.split(' + ');
    process = process.join(', ');
  }
  if (process.includes(' / ')) {
    process = process.split(' / ');
    process = process.join(', ');
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
  let title = item.title;
  if (title.includes('Instrumental')) {
    return ['Caturra', 'Castillo', 'Colombia'];
  } else if (title.includes('Rootbeer')) {
    return ['Parainema'];
  }
  let body = item.body_html;
  let variety = '';
  if (body.includes('Varietal:')) {
    variety = body.split('Varietal:')[1];
  } else if (body.includes('Variety:')) {
    variety = body.split('Variety:')[1];
  } else if (body.includes('Varieties:')) {
    variety = body.split('Varieties:')[1];
  }
  variety = variety.split('<');
  variety = variety[0].trim();
  if (variety.includes('Ethiopian Landrace') || variety.includes('Local Landraces') || variety.includes('Local Landrace')) {
    return ['Ethiopian Landrace']
  }
  if (variety.includes(' / ')) {
    variety = variety.split(' / ');
    variety = variety.map((word) => {
      return word[0] + word.substring(1).toLowerCase();
    })
  }
  if (variety.includes(' and ')) {
    variety = variety.split(' and ');
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
    variety = [variety];
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
    return ['Blend'];
  }
  if (variety[0] === "") {
    return 'Unknown';
  }
  return variety;
}

function getCountry(item) {
  let country = '';
  let countryList = countryInfo.getAllCountriesNames();
  let reportBody = item.body_html.split('From')[0];
  countryList.forEach((countryName) => {
    if (item.title.includes(countryName)) {
      country = countryName;
      return country;
    } else if (reportBody.includes(countryName)) {
      country = countryName;
      return country;
    }
  })
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