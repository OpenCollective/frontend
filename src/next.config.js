/*  eslint-disable-next-line node/no-extraneous-require */
const { IgnorePlugin, ContextReplacementPlugin } = require('webpack');
const { get } = require('lodash');
const withCSS = require('@zeit/next-css');

const nextConfig = {
  onDemandEntries: {
    // Make sure entries are not getting disposed.
    maxInactiveAge: 1000 * 60 * 60,
  },
  env: {
    API_KEY: null,
    API_URL: 'https://api.opencollective.com',
    INVOICES_URL: 'https://invoices.opencollective.com',
    DYNAMIC_IMPORT: true,
    WEBSITE_URL: 'https://opencollective.com',
  },
  webpack: config => {
    config.plugins.push(
      // Ignore __tests__
      new IgnorePlugin(/\/__tests__\//),
      // Only include our supported locales
      new ContextReplacementPlugin(/moment[/\\]locale$/, /en|fr|es|ja/),
    );

    if (process.env.WEBPACK_BUNDLE_ANALYZER) {
      // eslint-disable-next-line node/no-unpublished-require
      const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
      config.plugins.push(
        new BundleAnalyzerPlugin({
          analyzerMode: 'static',
          generateStatsFile: true,
          openAnalyzer: false,
        }),
      );
    }
    config.module.rules.push({
      test: /\.md$/,
      use: ['babel-loader', 'raw-loader', 'markdown-loader'],
    });

    // Inspired by https://github.com/rohanray/next-fonts
    // Load Bootstrap and Font-Awesome fonts
    config.module.rules.push({
      test: /fonts\/.*\.(woff|woff2|eot|ttf|otf|svg)$/,
      use: [
        {
          loader: 'url-loader',
          options: {
            limit: 8192,
            fallback: 'file-loader',
            publicPath: '/_next/static/fonts/',
            outputPath: 'static/fonts/',
            name: '[name]-[hash].[ext]',
          },
        },
      ],
    });

    // Configuration for static/marketing pages
    config.module.rules.unshift(
      {
        test: /static\/.*\.(html)$/,
        use: {
          loader: 'html-loader',
        },
      },
      {
        test: /static\/.*\.(css)$/,
        use: {
          loader: 'raw-loader',
        },
      },
      {
        test: /static\/.*\.(jpg|gif|png|svg)$/,
        use: {
          loader: 'file-loader',
          options: {
            publicPath: '/_next/static/img/',
            outputPath: 'static/img/',
            name: '[name]-[hash].[ext]',
          },
        },
      },
    );

    // Disable the rule forcing react to be bundled in commons chunk
    // Currently needed to skip the react-dom shipped by react-tag-input
    if (get(config, 'optimization.splitChunks.cacheGroups.react')) {
      delete config.optimization.splitChunks.cacheGroups.react;
    }

    return config;
  },
};

module.exports = withCSS(nextConfig);
