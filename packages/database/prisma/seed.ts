import { prisma } from '../src/client.js';

const danceStyles = [
  { name: 'Fancy Shawl', slug: 'fancy-shawl' },
  { name: 'Traditional', slug: 'traditional' },
  { name: 'Jingle', slug: 'jingle' },
  { name: 'Grass', slug: 'grass' },
  { name: 'Chicken', slug: 'chicken' },
  { name: 'Fancy Bustle', slug: 'fancy-bustle' },
  { name: 'Traditional Northern', slug: 'traditional-northern' },
  { name: 'Traditional Southern', slug: 'traditional-southern' },
  { name: 'Tiny Tot', slug: 'tiny-tot' },
  { name: 'Golden Age', slug: 'golden-age' },
];

async function main() {
  for (const style of danceStyles) {
    await prisma.danceStyle.upsert({
      where: { slug: style.slug },
      update: { name: style.name },
      create: style,
    });
  }
  // eslint-disable-next-line no-console -- CLI seed script output, not app runtime logging
  console.log(`Seeded ${danceStyles.length} dance styles.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
