// # Seed Taxonomy Data Script
// # Run with: npx ts-node prisma/seed-taxonomy.ts

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const domains = [
    { name: 'Programming', slug: 'programming', description: 'Software development and coding', icon: '💻', order: 1 },
    { name: 'Web Development', slug: 'web-development', description: 'Frontend and backend web technologies', icon: '🌐', order: 2 },
    { name: 'Data Science', slug: 'data-science', description: 'Data analysis, ML, and AI', icon: '📊', order: 3 },
    { name: 'DevOps', slug: 'devops', description: 'CI/CD, cloud, and infrastructure', icon: '⚙️', order: 4 },
    { name: 'Mobile Development', slug: 'mobile-development', description: 'iOS, Android, and cross-platform apps', icon: '📱', order: 5 },
];

const categoriesByDomain: Record<string, Array<{ name: string; slug: string; description: string; order: number }>> = {
    'programming': [
        { name: 'JavaScript', slug: 'javascript', description: 'JavaScript language and ecosystem', order: 1 },
        { name: 'TypeScript', slug: 'typescript', description: 'TypeScript typed superset of JavaScript', order: 2 },
        { name: 'Python', slug: 'python', description: 'Python programming language', order: 3 },
        { name: 'Java', slug: 'java', description: 'Java programming language', order: 4 },
        { name: 'Go', slug: 'go', description: 'Go/Golang programming', order: 5 },
        { name: 'Rust', slug: 'rust', description: 'Rust systems programming', order: 6 },
    ],
    'web-development': [
        { name: 'React', slug: 'react', description: 'React.js library', order: 1 },
        { name: 'Next.js', slug: 'nextjs', description: 'Next.js framework', order: 2 },
        { name: 'Vue.js', slug: 'vuejs', description: 'Vue.js framework', order: 3 },
        { name: 'Node.js', slug: 'nodejs', description: 'Node.js runtime', order: 4 },
        { name: 'CSS & Styling', slug: 'css-styling', description: 'CSS, Tailwind, and styling', order: 5 },
        { name: 'APIs & Backend', slug: 'apis-backend', description: 'REST, GraphQL, and backend', order: 6 },
    ],
    'data-science': [
        { name: 'Machine Learning', slug: 'machine-learning', description: 'ML algorithms and models', order: 1 },
        { name: 'Deep Learning', slug: 'deep-learning', description: 'Neural networks and DL', order: 2 },
        { name: 'Data Analysis', slug: 'data-analysis', description: 'Data exploration and analysis', order: 3 },
        { name: 'AI & LLMs', slug: 'ai-llms', description: 'Artificial intelligence and LLMs', order: 4 },
    ],
    'devops': [
        { name: 'Docker', slug: 'docker', description: 'Containerization with Docker', order: 1 },
        { name: 'Kubernetes', slug: 'kubernetes', description: 'Container orchestration', order: 2 },
        { name: 'AWS', slug: 'aws', description: 'Amazon Web Services', order: 3 },
        { name: 'CI/CD', slug: 'cicd', description: 'Continuous integration and deployment', order: 4 },
    ],
    'mobile-development': [
        { name: 'React Native', slug: 'react-native', description: 'Cross-platform with React Native', order: 1 },
        { name: 'Flutter', slug: 'flutter', description: 'Cross-platform with Flutter', order: 2 },
        { name: 'iOS/Swift', slug: 'ios-swift', description: 'iOS development with Swift', order: 3 },
        { name: 'Android/Kotlin', slug: 'android-kotlin', description: 'Android development with Kotlin', order: 4 },
    ],
};

const seedTaxonomy = async () => {
    console.log('🌱 Seeding taxonomy data...\n');

    // Create domains
    for (const domain of domains) {
        const created = await prisma.domain.upsert({
            where: { slug: domain.slug },
            update: { ...domain },
            create: { ...domain, isActive: true },
        });
        console.log(`✅ Domain: ${created.name}`);

        // Create categories for this domain
        const categories = categoriesByDomain[domain.slug] ?? [];
        for (const category of categories) {
            const createdCat = await prisma.category.upsert({
                where: { slug: category.slug },
                update: { ...category, domainId: created.id },
                create: { ...category, domainId: created.id },
            });
            console.log(`   📁 Category: ${createdCat.name}`);
        }
    }

    console.log('\n✅ Taxonomy seeding complete!');
};

seedTaxonomy()
    .catch((e) => {
        console.error('❌ Seeding failed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
