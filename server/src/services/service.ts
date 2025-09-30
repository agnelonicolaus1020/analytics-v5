import type { Core } from '@strapi/strapi';

import {subHours, formatISO, startOfDay, endOfDay, parseISO} from 'date-fns';


const uid = "plugin::strapi-plugin-analytics-v5.analytic";

const service = ({ strapi }: { strapi: Core.Strapi }) => ({
  async getData() {
    const analytics = await strapi.documents(uid).findMany();
    return { data : analytics };
  },

  async getAnalyticsWithFilters(obbj) {
    const user = obbj.user.id ? obbj.user.id.toString() : (obbj.user.guest_id || '');
    const analyticsHours = subHours(new Date(), strapi.config.get('plugin.analytics.analytics_hours'));

    const analyticsFilters = {
      $and: [
        { event_type: obbj.event_type },
        { collection_name: obbj.collection_name },
        { collection_id: obbj.collection_id },
        { user_token: user },
        { createdAt: { $gt: analyticsHours } }
      ]
    };
    
    if (obbj.field) {
      // @ts-ignore
      analyticsFilters.$and.push({ field: obbj.field });
    }

    return await strapi.documents(uid).findMany({ filters: analyticsFilters });
  },

  async getAnalyticsData() {
    const analytics = await strapi.documents(uid).findMany();

    const groupedData = {};

    analytics.forEach(item => {
      const entityId = item.collection_id + '-' + item.collection_name;
      const field = item.field;
  
      if (!groupedData[entityId]) {
        groupedData[entityId] = {
          entity_id: item.collection_id,
          entity_name: item.collection_name,
          data: []
        };
      }
  
      // Find the index of the field in the data array
      const index = groupedData[entityId].data.findIndex(obj => obj.field === field);
      if (index === -1) {
        // If the field does not exist, add it to the data array
        groupedData[entityId].data.push({ field, count: 1 });
      } else {
        // If the field already exists, increment its count
        groupedData[entityId].data[index].count++;
      }
    });
  
    return { data : Object.values(groupedData) };
  },

  async getOverview() {
    const analytics = await strapi.documents(uid).findMany();

    const groupedData = {};

    analytics.forEach(item => {
      const entityId = item.collection_name;
  
      if (!groupedData[entityId]) {
        groupedData[entityId] = {
          entity_name: item.collection_name,
          counter: 1
        };
      } else {
        groupedData[entityId].counter++;
      }
    });
  
    return { data : Object.values(groupedData) };
  },
  
  async getList(ctx) {
    return await strapi.documents(uid).findMany(ctx.request.query);
  },

  async getIdentifierOverviewService(ctx) {
    const { start_date, end_date, identifier, collection = null } = ctx.request.query;
    const { filters = {} } = ctx.request.query;

    if (start_date) {
      filters.createdAt = filters.createdAt || {};
      filters.createdAt.$gte = formatISO(startOfDay(parseISO(start_date)));
    }

    if (end_date) {
      filters.createdAt = filters.createdAt || {};
      filters.createdAt.$lte = formatISO(endOfDay(parseISO(end_date)));
    }

    if (identifier) {
      filters.identifier = { $eq: identifier };
    }
    else {
      filters.identifier = { $notNull: true };
    }

    if (collection) {
      filters.collection_name = { $eq: collection };
    }
    else {
      filters.collection_name = { $eq: 'business-directory' };
    }

    const analytics = await strapi.documents(uid).findMany({
      ...ctx.request.query,
      filters,
    });

    console.log(analytics.length);

    const groupedData = {};

    analytics.forEach((item) => {
      const identifier = item.identifier;
      if (!identifier) {
        return;
      }

      let field = item.field;
      if (!field && item.event_type === 'viewed') {
        field = 'page_views';
      }

      if (!groupedData[identifier]) {
        groupedData[identifier] = {
          record_identifier: identifier,
          type: item.record_type,
          data: [
            {
              "identifier": "page_views",
              "count": 0
            },
            {
              "identifier": "email",
              "count": 0
            },
            {
              "identifier": "direction",
              "count": 0
            },
            {
              "identifier": "website",
              "count": 0
            },
            {
              "identifier": "phone_number",
              "count": 0
            }
          ],
          meta: {
            analytics_key: identifier,
          }
        };
      }

      groupedData[identifier]['type'] = item.record_type;

      // Find the index of the field in the data array
      const index = groupedData[identifier].data.findIndex((obj) => obj.identifier === field);
      if (index === -1) {
        // If the field does not exist, add it to the data array
        groupedData[identifier].data.push({ identifier: field, count: 1 });
      } else {
        // If the field already exists, increment its count
        groupedData[identifier].data[index].count++;
      }
    });

    return { data: Object.values(groupedData) };
  },

  async createService(ctx) {
    const { event_type, collection_name, collection_id, field, identifier, record_type = null } = ctx.request.body;
    const { user } = ctx.state;

    const config_attempts_enabled = strapi.config.get('plugin.analytics.attempts_enabled') as boolean;
    const config_attempts = strapi.config.get('plugin.analytics.analytics_attempts') as number;
    if(config_attempts_enabled) {
      const exists = await this.getAnalyticsWithFilters({ event_type, collection_name, collection_id, field, user });

      if (exists?.length >= config_attempts) {
        return ctx.badRequest('Analytics per day exceeded');
      }
    }

    const data = {
      event_type,
      collection_name,
      collection_id,
      field,
      identifier: identifier ? `${identifier}` : '',
      user_token: user.id ? user.id.toString() : (user.guest_id || ''),
      record_type,
      publishedAt: new Date()
    };

    const analytics = await strapi.entityService.create(uid, { data });

    if (analytics?.id) {
      return {
        message: 'Analytics entry created successfully',
        status: 201
      };
    }

    return ctx.badRequest('Failed to create analytics entry');
  },
});

export default service;
