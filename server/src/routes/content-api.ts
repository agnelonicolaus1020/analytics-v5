export default [
  {
    method: 'GET',
    path: '/',
    handler: 'controller.getData',
    config: {
      policies: [],
    },
  },
  {
    method: 'POST',
    path: '/',
    handler: 'controller.create',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/data',
    handler: 'controller.getAnalyticsData',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/overview',
    handler: 'controller.getOverview',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/overview-identifier',
    handler: 'controller.getIdentifierOverview',
    config: {
      policies: [],
    },
  },
  {
    method: 'GET',
    path: '/list',
    handler: 'controller.getList',
    config: {
      policies: [],
    },
  },
];
