const url = require('url');
const db = require('./db')

module.exports = async function update(products, brand) {
  products.forEach(async (item) => {
    const param = new url.URLSearchParams(item);
    const dbItem = await db.get(`/item/product_url?product_url=${param.get('product_url')}`);
    if (dbItem.data.data.length === 0) {
      await db.post('/', item);
    } else {
      try {
        await db.put(`/item?product_url=${item.product_url}`, {
          price: item.price,
          weight: item.weight,
          sold_out: item.sold_out,
          image_url: item.image_url,
          date_added: item.date_added,
          product_url: item.product_url
        });
      } catch (error) {
        console.log(error);
      }
    }
  });

  const productsByBrand = await db.get(`/item/brand?brand=${brand}`);
  if (productsByBrand.data.data.length !== 0) {
    productsByBrand.data.data.forEach(async (productObj) => {
      let isInDb = false;
      products.forEach((currentItem) => {
        if (productObj.product_url === currentItem.product_url) {
          isInDb = true;
        }
      });
      if (!isInDb) {
        try {
          await db.delete(`/item?product_url=${productObj.product_url}`);
        } catch (error) {
          console.log(error);
        }
        isInDb = false;
      }
    });
  }
}