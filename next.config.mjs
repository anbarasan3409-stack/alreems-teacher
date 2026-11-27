/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(self), display-capture=(self)',
          },
        ],
      },
    ];
  },
  webpack: (config, { isServer }) => {
    // Completely externalize whiteboard SDK on server
    if (isServer) {
      config.externals = [...(config.externals || []), 'white-web-sdk', '@netless/window-manager'];
    }
    
    // Provide empty fallbacks for Node.js modules in browser
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      path: false,
      stream: false,
      util: false,
      buffer: false,
      process: false,
      os: false,
      http: false,
      https: false,
      zlib: false,
      url: false,
      querystring: false,
      events: false,
      child_process: false,
    };

    // Add a custom rule to handle white-web-sdk imports
    config.module = config.module || {};
    config.module.rules = config.module.rules || [];
    
    // Prevent webpack from parsing node_modules in white-web-sdk
    config.module.noParse = config.module.noParse || [];
    if (Array.isArray(config.module.noParse)) {
      config.module.noParse.push(/white-web-sdk/);
      config.module.noParse.push(/@netless\/window-manager/);
    }
    
    return config;
  },
};

export default nextConfig;
