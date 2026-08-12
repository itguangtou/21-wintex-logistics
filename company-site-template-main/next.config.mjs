import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/careers.html',
        destination: '/api/careers-page'
      }
    ];
  }
};

export default withNextIntl(nextConfig);