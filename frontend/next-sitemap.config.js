/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://next-gig.co.uk', // or next-gig.co.uk for your other subdomain
  generateRobotsTxt: true,
  generateIndexSitemap: true,
  outDir: './public',
  sourceDir: './.next', // 🔑 tells next-sitemap where to look
};
