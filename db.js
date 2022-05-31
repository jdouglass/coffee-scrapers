const axios = require('axios');
require('dotenv').config();

module.exports = axios.create({
  baseURL: `http://localhost:5000/products`
});