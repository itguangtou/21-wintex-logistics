import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./i18n.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/careers.html',
        has: [{ type: 'query', key: 'lang', value: 'en' }],
        destination: '/en/careers',
        permanent: false,
      },
      {
        source: '/careers.html',
        destination: '/zh/careers',
        permanent: false,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
