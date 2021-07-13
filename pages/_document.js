import '../env';

import React from 'react';
import { pick } from 'lodash';
import Document, { Head, Html, Main, NextScript } from 'next/document';
import { ServerStyleSheet } from 'styled-components';
import { v4 as uuid } from 'uuid';

import { parseToBoolean } from '../lib/utils';
import { getCSPHeader } from '../server/content-security-policy';

const cspHeader = getCSPHeader();

// The document (which is SSR-only) needs to be customized to expose the locale
// data for the user's locale for React Intl to work in the browser.
export default class IntlDocument extends Document {
  static async getInitialProps(ctx) {
    const { locale, localeDataScript, url } = ctx.req;

    const sheet = new ServerStyleSheet();
    const originalRenderPage = ctx.renderPage;

    const clientAnalytics = {
      enabled: parseToBoolean(process.env.CLIENT_ANALYTICS_ENABLED),
      siteId: Number(process.env.CLIENT_ANALYTICS_SITE_ID),
      customUrl: null,
    };
    if (url.match(/\.html/) || url.match(/\/button/)) {
      clientAnalytics.enabled = false;
    }
    if (url.match(/\/signin\/sent/)) {
      clientAnalytics.customUrl = '/signin/sent';
    } else if (url.match(/\/signin\//)) {
      clientAnalytics.customUrl = '/signin/token';
    }

    // On server-side, add a CSP header
    let requestNonce;
    if (ctx.res && cspHeader) {
      requestNonce = uuid();
      ctx.res.setHeader(cspHeader.key, cspHeader.value.replace('__OC_REQUEST_NONCE__', requestNonce));
    }

    try {
      ctx.renderPage = () =>
        originalRenderPage({
          enhanceApp: App => props => sheet.collectStyles(<App {...props} />),
        });

      const initialProps = await Document.getInitialProps(ctx);

      return {
        ...initialProps,
        locale,
        localeDataScript,
        clientAnalytics,
        cspNonce: requestNonce,
        styles: (
          <React.Fragment>
            {initialProps.styles}
            {sheet.getStyleElement()}
          </React.Fragment>
        ),
      };
    } finally {
      sheet.seal();
    }
  }

  constructor(props) {
    super(props);
    if (props.cspNonce) {
      props.__NEXT_DATA__.cspNonce = props.cspNonce;
    }
    // We pick the environment variables that we want to access from the client
    // They can later be read with getEnvVar()
    // Please, NEVER SECRETS!
    props.__NEXT_DATA__.env = pick(process.env, [
      'REST_URL',
      'IMAGES_URL',
      'REJECT_CONTRIBUTION',
      'REJECTED_CATEGORIES',
      'PAYPAL_ENVIRONMENT',
      'STRIPE_KEY',
      'SENTRY_DSN',
      'SENTRY_RELEASE',
      'WEBSITE_URL',
      'GOOGLE_MAPS_API_KEY',
      'RECAPTCHA_SITE_KEY',
      'RECAPTCHA_ENABLED',
      'WISE_ENVIRONMENT',
    ]);
  }

  clientAnalyticsCode() {
    const lines = [];
    lines.push(`var _paq = window._paq || [];`);
    if (this.props.clientAnalytics.customUrl) {
      lines.push(`_paq.push(['setCustomUrl', '${this.props.clientAnalytics.customUrl}']);`);
    }
    lines.push(`_paq.push(['trackPageView']);`);
    lines.push(`_paq.push(['enableLinkTracking']);`);
    lines.push(`(function() {
      var u="https://opencollective.matomo.cloud/";
      _paq.push(['setTrackerUrl', u+'matomo.php']);
      _paq.push(['setSiteId', '${this.props.clientAnalytics.siteId}']);
      var d=document, g=d.createElement('script'), s=d.getElementsByTagName('script')[0];
      g.type='text/javascript'; g.async=true; g.defer=true; g.src='https://cdn.matomo.cloud/opencollective.matomo.cloud/matomo.js'; s.parentNode.insertBefore(g,s);
    })();`);
    return lines.join('\n');
  }

  render() {
    return (
      <Html>
        <Head nonce={this.props.cspNonce} />
        <body>
          <Main nonce={this.props.cspNonce} />
          <script
            nonce={this.props.cspNonce}
            dangerouslySetInnerHTML={{
              __html: this.props.localeDataScript,
            }}
          />
          <NextScript nonce={this.props.cspNonce} />
          {this.props.clientAnalytics.enabled && (
            <script nonce={this.props.cspNonce} dangerouslySetInnerHTML={{ __html: this.clientAnalyticsCode() }} />
          )}
        </body>
      </Html>
    );
  }
}
