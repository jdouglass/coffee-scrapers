const Bree = require('bree');
const express = require('express');

const app = express();
const port = process.env.SCRAPE_PORT || 5101;

const bree = new Bree({
  jobs: [
    {
      name: 'subtext',
      cron: '0 */12 * * *'

    },
    {
      name: 'monogram',
      cron: '0 */12 * * *'

    },
    {
      name: 'pirates',
      cron: '0 */12 * * *'

    },
    {
      name: 'revolver',
      cron: '0 */12 * * *'

    },
  ]
})

bree.start();

app.listen(port, () => {
  console.log(`server is running and listening on port ${port}`);
})