const createOrderPage = '/contribution-flow';
const contributionFlowSteps = '/details|profile|payment|summary|success';

exports.REWRITES = [
  {
    source: '/:pageSlug(become-a-host|become-a-fiscal-host)',
    destination: '/become-a-host',
  },
  {
    source: '/:pageSlug(widgets|tos|privacypolicy|support|hiring)',
    destination: '/staticPage',
  },
  {
    source: '/foundation/apply/:step(intro|fees|form|success)?',
    destination: '/ocf-host-application',
  },
  {
    source: '/signin/sent',
    destination: '/signinLinkSent',
  },
  {
    source: '/deleteCollective/confirmed',
    destination: '/confirmCollectiveDeletion',
  },
  {
    source: '/create-account/guest',
    destination: '/guest-join',
  },
  {
    source: '/subscriptions',
    destination: '/recurring-contributions-redirect',
  },
  {
    source: '/recurring-contributions',
    destination: '/recurring-contributions-redirect',
  },
  {
    source: '/organizations/new',
    destination: '/createOrganization',
  },
  {
    source: '/:collectiveSlug/updates',
    destination: '/updates',
  },
  {
    source: '/:collectiveSlug/updates/new',
    destination: '/createUpdate',
  },
  {
    source: '/:collectiveSlug/updates/:updateSlug',
    destination: '/update',
  },
  {
    source: '/:collectiveSlug?/redeem/:code?',
    destination: '/redeem',
  },
  {
    source: '/:collectiveSlug?/redeemed/:code?',
    destination: '/redeemed',
  },
  {
    source: '/:collectiveSlug/paymentmethod/:id/update',
    destination: '/updatePaymentMethod',
  },
  {
    source: '/:collectiveSlug/banner.html',
    destination: '/banner-iframe',
  },
  {
    source: '/:collectiveSlug/(collectives|widget).html',
    destination: '/collectives-iframe',
  },
  {
    source: '/redirect',
    destination: '/external-redirect',
  },
  {
    source: '/signin/:token?',
    destination: '/signin',
  },
  {
    source: '/confirm/email/:token',
    destination: '/confirmEmail',
  },
  {
    source: '/confirm/guest/:token',
    destination: '/confirm-guest',
  },
  {
    source: '/email/unsubscribe/:email/:slug/:type/:token',
    destination: '/unsubscribeEmail',
  },
  {
    source: '/:form(create-account)',
    destination: '/signin',
  },
  {
    source: '/:collectiveSlug/:verb(contribute|donate)/button',
    destination: '/button',
  },
  {
    source: '/:parentCollectiveSlug/events/(new|create)',
    destination: '/createEvent',
  },
  {
    source: '/:parentCollectiveSlug/projects/(new|create)',
    destination: '/create-project',
  },
  {
    source: '/:parentCollectiveSlug/events/:eventSlug/edit/:section?',
    destination: '/editEvent',
  },
  {
    source: '/:slug/edit/:section?',
    destination: '/editCollective',
  },
  {
    source: '/:slug/delete',
    destination: '/collective-delete',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/contact',
    destination: '/collective-contact',
  },
  {
    source: '/:hostCollectiveSlug/collectives/expenses',
    destination: '/host.dashboard',
  },
  {
    source: '/:hostCollectiveSlug/dashboard/:view(expenses|pending-applications|hosted-collectives|donations)?',
    destination: '/host.dashboard',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/transactions',
    destination: '/transactions',
  },
  {
    source: '/:parentCollectiveSlug?/:type(events|projects)?/:collectiveSlug/expenses/new',
    destination: '/create-expense',
  },
  {
    source:
      '/:parentCollectiveSlug?/:collectiveType(evenExpenseAdminActionsts|projects)?/:collectiveSlug/expenses/:ExpenseId([0-9]+)/:version(v2)?',
    destination: '/expense',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/expenses/:version(v2)?',
    destination: '/expenses',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/orders',
    destination: '/orders',
  },
  {
    source: '/:parentCollectiveSlug?/:collectiveType(events|projects)?/:collectiveSlug/orders/:OrderId([0-9]+)',
    destination: '/order',
  },
  {
    source: '/orders/:id([0-9]+)/confirm',
    destination: '/confirmOrder',
  },
  {
    source: '/fund/:verb(apply|create)/:step(form)?',
    destination: '/create-fund',
  },

  // New Create Collective Flow
  {
    source:
      '/:hostCollectiveSlug?/:verb(apply|create)/:version(v2)?/:category(opensource|community|climate|covid-19)?/:step(form)?',
    destination: '/create-collective',
  },
  // Events and Projects using collective page
  {
    source: '/:parentCollectiveSlug/events/:slug',
    destination: '/collective-page',
  },
  {
    source: '/:parentCollectiveSlug/projects/:slug',
    destination: '/collective-page',
  },
  // Tier page
  {
    source: '/:collectiveSlug/:verb(tiers|contribute)',
    destination: '/contribute',
  },
  {
    source: '/:collectiveSlug/:verb(tiers|contribute)/:tierSlug?-:tierId([0-9]+)',
    destination: '/tier',
  },
  // Conversations
  {
    source: '/:collectiveSlug/conversations',
    destination: '/conversations',
  },
  {
    source: '/:collectiveSlug/conversations/new',
    destination: '/create-conversation',
  },
  {
    source: '/:collectiveSlug/conversations/:slug?-:id([a-z0-9]+)',
    destination: '/conversation',
  },
  // Contribute Flow
  // ---------------
  // Legacy create order route. Deprectated on 2019-02-12
  {
    source: '/:collectiveSlug/:verb(order)/:tierId/:amount(\\d+)?/:interval(month|monthly|year|yearly)?',
    destination: createOrderPage,
  },
  // Legacy tier route. Deprectated on 2019-06-07
  {
    source: `/:collectiveSlug/:verb(donate|pay|contribute|order|events)/tier/:tierId-:tierSlug?/:step(${contributionFlowSteps})?`,
    destination: createOrderPage,
  },
  // New Routes -> New flow
  {
    source: `/:collectiveSlug/:verb(donate|pay|order|events)/:step(${contributionFlowSteps})?`,
    destination: createOrderPage,
  },
  {
    source: `/:collectiveSlug/:verb(contribute)/:tierSlug?-:tierId([0-9]+)/checkout/:step(${contributionFlowSteps})?`,
    destination: createOrderPage,
  },
  // Generic Route
  {
    source:
      '/:collectiveSlug/:verb(donate|pay|order|events)/:amount(\\d+)?/:interval(month|monthly|year|yearly)?/:description?',
    destination: createOrderPage,
  },
  // Events
  {
    source: `/:collectiveSlug/:verb(events|projects)/:eventSlug/order/:tierId/:step(${contributionFlowSteps})?`,
    destination: createOrderPage,
  },
  // Embed
  {
    source: `/embed/:collectiveSlug/donate/:step(${contributionFlowSteps})?`,
    destination: '/embed/contribution-flow',
  },
  {
    source: `/embed/:collectiveSlug/contribute/:tierSlug?-:tierId([0-9]+)/:step(${contributionFlowSteps})?`,
    destination: '/embed/contribution-flow',
  },
  // Pledges
  {
    source: `/pledges/new`,
    destination: '/createPledge',
  },
  {
    source: `/:slug/pledges/new`,
    destination: '/createPledge',
  },
  // Marketing Pages
  {
    source: `/:pageSlug(how-it-works|gift-of-giving|gift-cards)`,
    destination: '/marketingPage',
  },
  // New accept financial contributions flow
  {
    source:
      '/:slug/accept-financial-contributions/:path(ourselves|myself|organization|host)?/:method(stripe|bank)?/:state(success)?',
    destination: '/accept-financial-contributions',
  },
  // New recurring contributions page
  {
    source: '/:slug/recurring-contributions',
    destination: '/recurring-contributions',
  },
  {
    source: '/:slug/subscriptions',
    destination: '/recurring-contributions',
  },
  // Path routing: all the rewrites below are ready to be removed as soon as we
  // set `useFileSystemPublicRoutes` to true (default) in `next.config.js`
  {
    source: '/',
    destination: '/home',
  },
  {
    source: '/discover',
    destination: '/discover',
  },
  {
    source: '/search',
    destination: '/search',
  },
  {
    source: '/hosts',
    destination: '/hosts',
  },
  {
    source: '/pricing',
    destination: '/pricing',
  },
  {
    source: '/pricing-old',
    destination: '/pricing-old',
  },
  {
    source: '/become-a-sponsor',
    destination: '/become-a-sponsor',
  },
  {
    source: '/member-invitations',
    destination: '/member-invitations',
  },
  {
    source: '/applications',
    destination: '/applications',
  },
  // Collective
  // ----------
  // Collective page
  {
    source: '/:slug',
    destination: '/collective-page',
  },
  {
    source: '/:slug/:mode(onboarding)?/:step(administrators|contact-info|success)?',
    destination: '/collective-page',
  },
];
