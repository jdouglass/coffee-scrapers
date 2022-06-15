const url = require('url');
const db = require('./db')

module.exports = async function update(products, vendor) {
  products.forEach(async (item) => {
    const param = new url.URLSearchParams(item);
    const dbItem = await db.get(`/item/product_url?product_url=${param.get('product_url')}`);
    if (dbItem.data.data.length === 0) {
      await db.post('/', item);
    } else {
      try {
        await db.put(`/item?product_url=${item.product_url}`, {
          brand: item.brand,
          title: item.title,
          price: item.price,
          weight: item.weight,
          process: item.process,
          process_category: item.process_category,
          variety: item.variety,
          country: item.country,
          continent: item.continent,
          image_url: item.image_url,
          sold_out: item.sold_out,
          vendor: item.vendor,
          product_url: item.product_url
        });
      } catch (error) {
        console.log(error);
      }
    }
  });

  const productsByVendor = await db.get(`/item/vendor?vendor=${vendor}`);
  if (productsByVendor.data.data.length !== 0) {
    let isInDb = false;
    for await (const dbProduct of productsByVendor.data.data) {
      isInDb = false;
      for (const scrapedProduct of products) {
        if (dbProduct.product_url === scrapedProduct.product_url) {
          isInDb = true;
          break;
        }
      };
      if (!isInDb) {
        try {
          await db.delete(`/item?product_url=${dbProduct.product_url}`);
        } catch (error) {
          console.log(error);
        }
        isInDb = false;
      }
    };
  }
}