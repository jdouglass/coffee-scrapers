const axios = require('axios');
require('dotenv').config();

const port = process.env.PORT || 5001;

module.exports = axios.create({
  baseURL: `http://localhost:${port}/products`
});