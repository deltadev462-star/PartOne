import prisma from '../configs/prisma.js';

async function main() {
  // Create pricing plans
  const plans = [
    {
      name: 'Free',
      type: 'FREE',
      price: 0,
      currency: 'USD',
      interval: null,
      description: 'Perfect for individuals getting started',
      features: JSON.stringify([
        '1 Project',
        '1 Workspace',
        '3 Team Members',
        'Basic task management',
        'Basic analytics'
      ]),
      maxProjects: 1,
      maxWorkspaces: 1,
      maxTeamMembers: 3,
      stripeProductId: null,
      stripePriceId: null
    },
    {
      name: 'Starter',
      type: 'STARTER',
      price: 9.99,
      currency: 'USD',
      interval: 'month',
      description: 'Great for small teams',
      features: JSON.stringify([
        '10 Projects',
        '3 Workspaces',
        '10 Team Members',
        'Advanced task management',
        'Advanced analytics',
        'Priority support',
        'Custom integrations'
      ]),
      maxProjects: 10,
      maxWorkspaces: 3,
      maxTeamMembers: 10,
      stripeProductId: 'prod_PLACEHOLDER_STARTER',
      stripePriceId: 'price_PLACEHOLDER_STARTER'
    },
    {
      name: 'Professional',
      type: 'PROFESSIONAL',
      price: 29.99,
      currency: 'USD',
      interval: 'month',
      description: 'Best for growing organizations',
      features: JSON.stringify([
        'Unlimited Projects',
        'Unlimited Workspaces',
        'Unlimited Team Members',
        'Advanced task management',
        'Advanced analytics',
        'Premium support',
        'Custom integrations',
        'API access',
        'Advanced security features'
      ]),
      maxProjects: 999999, // Effectively unlimited
      maxWorkspaces: 999999,
      maxTeamMembers: 999999,
      stripeProductId: 'prod_PLACEHOLDER_PROFESSIONAL',
      stripePriceId: 'price_PLACEHOLDER_PROFESSIONAL'
    }
  ];

  console.log('Seeding pricing plans...');

  for (const plan of plans) {
    await prisma.pricingPlan.upsert({
      where: { type: plan.type },
      update: plan,
      create: plan
    });
    console.log(`Created/Updated plan: ${plan.name}`);
  }

  console.log('Seeding completed!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });