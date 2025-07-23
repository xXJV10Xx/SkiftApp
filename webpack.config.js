const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);
  
  // Fix for badgin module issue on web
  config.resolve.fallback = {
    ...config.resolve.fallback,
    "badgin": false
  };
  
  // Ignore badgin module completely
  config.plugins.push(
    new config.webpack.IgnorePlugin({
      resourceRegExp: /^badgin$/,
    })
  );
  
  return config;
}; 