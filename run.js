const Bree = require('bree')

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

bree.run();