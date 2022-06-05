require('dotenv').config();
const Bree = require('bree');
const express = require('express');

const app = express();
const port = process.env.PORT || 5001;

const bree = new Bree({
  jobs: [
    {
      name: 'subtext',
      cron: '* * * * *'

    },
    {
      name: 'monogram',
      cron: '* * * * *'

    },
    {
      name: 'pirates',
      cron: '* * * * *'

    },
    {
      name: 'revolver',
      cron: '* * * * *'

    },
  ]
})

bree.start();

app.listen(port, () => {
  console.log(`server is running and listening on port ${port}`);
})