import contentAPIRoutes from './content-api';
import adminAPIRoutes from './admin';

const routes = {
  admin: {
    type: 'admin',
    routes: adminAPIRoutes,
  },
  'content-api': {
    type: 'content-api',
    routes: contentAPIRoutes,
  },
};

export default routes;
