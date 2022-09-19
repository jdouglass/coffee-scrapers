const { PrismaClient } = require('@prisma/client');
const AWS = require('aws-sdk');
const axios = require('axios').default;
require('dotenv').config();

const bucketName = process.env.AWS_BUCKET_NAME;
const region = process.env.AWS_BUCKET_REGION;
const accessKeyId = process.env.AWS_S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.AWS_S3_SECRET_ACCESS_KEY;
const prisma = new PrismaClient();

const s3 = new AWS.S3({
  region,
  accessKeyId,
  secretAccessKey
});

async function downloadFile(item) {
  await axios({
    method: 'get',
    url: item.image_url,
    responseType: 'arraybuffer',
  }).then(async function (response) {
    const contentType = response.headers['content-type'];
    const uploadParams = {
      Bucket: bucketName,
      Body: Buffer.from(response.data, 'base64'),
      Key: item.product_url,
      ContentType: contentType,
      ContentEncoding: 'base64',
    }
    return new Promise((resolve) => {
      s3.upload(uploadParams, (err, data) => {
        if (err) {
          console.error(err);
          resolve(err);
        } else {
          item.image_url = data.Location;
          resolve(data);
        }
      })
    })
  });
}

module.exports = async function updateDb(productsList, vendor) {
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
        const params = {
          Bucket: bucketName,
          Key: dbProduct.product_url
        }
        try {
          s3.deleteObject(params).promise();
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

  productsList.forEach(async (item) => {
    await downloadFile(item);
    await prisma.products.upsert({
      where: { product_url: item.product_url },
      update: {
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
        vendor: item.vendor
      },
      create: item
    })
  })
}