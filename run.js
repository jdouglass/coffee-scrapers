const Bree = require('bree');
const express = require('express');

const app = express();
const port = process.env.SCRAPE_PORT || 5101;
const cronSchedule = '0 * * * *';

const bree = new Bree({
  jobs: [
    {
      name: 'subtext',
      cron: cronSchedule
    },
    {
      name: 'monogram',
      cron: cronSchedule
    },
    {
      name: 'pirates',
      cron: cronSchedule
    },
    {
      name: 'revolver',
      cron: cronSchedule
    },
    {
      name: 'rogueWave',
      cron: cronSchedule
    },
  ]
})

bree.start();

app.listen(port, () => {
  console.log(`server is running and listening on port ${port}`);
})