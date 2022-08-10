const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = async function update(productsList, vendor) {
  productsList.forEach(async (item) => {
    const dbItem = await prisma.products.findUnique({
      where: {
        product_url: item.product_url,
      },
    });
    if (dbItem != null || dbItem != undefined) {
      await prisma.products.update({
        where: { id: dbItem.id },
        data: {
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
        }
      })
    } else {
      await prisma.products.create({
        data: item,
      })
    }
  });

  const productsByVendor = await prisma.products.findMany({
    where: { vendor }
  });
  if (productsByVendor.length !== 0) {
    let isInDb = false;
    for await (const dbProduct of productsByVendor) {
      isInDb = false;
      for (const scrapedProduct of productsList) {
        if (dbProduct.product_url === scrapedProduct.product_url) {
          isInDb = true;
          break;
        }
      };
      if (!isInDb) {
        try {
          await prisma.products.delete({
            where: { product_url: dbProduct.product_url },
          });
        } catch (error) {
          console.log(error);
        }
        isInDb = false;
      }
    };
  }
}