const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Suppress the critical dependency warnings from @vladmandic/face-api
      webpackConfig.plugins.push(
        new webpack.ContextReplacementPlugin(
          /\/@vladmandic\/face-api/,
          (data) => {
            delete data.dependencies[0].critical;
            return data;
          }
        )
      );

      // Ignore specific warnings
      webpackConfig.ignoreWarnings = [
        {
          module: /node_modules\/@vladmandic\/face-api/,
          message: /Critical dependency: require function is used in a way in which dependencies cannot be statically extracted/,
        },
      ];

      return webpackConfig;
    },
  },
};
