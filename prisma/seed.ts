import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { DEFAULT_SITE_CONTENT } from '../src/lib/site-content-data'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // 1. Admin User
  const hashedPassword = await bcrypt.hash('admin@123', 10)
  const existingAdmin = await prisma.adminUser.findFirst({
    where: { email: 'admin@lawfirm.com', tenantId: null }
  })
  const admin = existingAdmin
    ? await prisma.adminUser.update({
        where: { id: existingAdmin.id },
        data: { password: hashedPassword, isPasswordResetNeeded: false }
      })
    : await prisma.adminUser.create({
        data: {
          email: 'admin@lawfirm.com',
          name: 'Senior Administrator',
          password: hashedPassword,
          role: 'admin'
        }
      })
  console.log('Admin user created:', admin.email)

  // 2. About Profile
  const profile = await prisma.aboutProfile.upsert({
    where: { id: 'default-profile' },
    update: {},
    create: {
      id: 'default-profile',
      name: 'Adv. Rajesh Kumar',
      title: 'Senior Advocate, High Court',
      aboutContent: 'With over 25 years of experience in the legal field, Adv. Rajesh Kumar has established himself as a leading voice in corporate and civil litigation. Our firm is dedicated to providing personalized legal solutions with integrity and excellence.',
      socialLinks: JSON.stringify({
        linkedin: 'https://linkedin.com',
        twitter: 'https://twitter.com',
        facebook: 'https://facebook.com',
        instagram: 'https://instagram.com'
      }),
      officeDetails: JSON.stringify({
        address: '123 Legal District, Business Avenue, Mumbai, Maharashtra 400001, India',
        phone: '+91 98765 43210',
        email: 'contact@kumaradvocates.com'
      })
    }
  })
  console.log('About profile created')

  // 3. Practice Areas
  const practiceAreas = [
    {
      title: 'Corporate Law',
      slug: 'corporate-law',
      description: 'Comprehensive legal support for businesses, including formation, contracts, and compliance.',
      icon: 'Building2',
      order: 1
    },
    {
      title: 'Criminal Defense',
      slug: 'criminal-defense',
      description: 'Strong representation for individuals facing criminal charges, ensuring justice is served.',
      icon: 'ShieldAlert',
      order: 2
    },
    {
      title: 'Family Law',
      slug: 'family-law',
      description: 'Sensitive handling of matrimonial disputes, child custody, and inheritance matters.',
      icon: 'Users2',
      order: 3
    },
    {
      title: 'Real Estate',
      slug: 'real-estate',
      description: 'Expert guidance on property transactions, title verification, and dispute resolution.',
      icon: 'Home',
      order: 4
    }
  ]

  for (const area of practiceAreas) {
    await prisma.practiceArea.upsert({
      where: { slug: area.slug },
      update: area,
      create: area
    })
  }
  console.log('Practice areas created')

  // 4. Testimonials
  const testimonials = [
    {
      name: "Rajesh Kumar",
      role: "CEO, Tech Solutions Ltd.",
      content: "Outstanding legal representation! Their expertise in corporate law helped us navigate a complex merger seamlessly.",
      rating: 5,
      order: 1
    },
    {
      name: "Priya Sharma",
      role: "Entrepreneur",
      content: "Professional, responsive, and incredibly knowledgeable. They handled our intellectual property case with exceptional skill.",
      rating: 5,
      order: 2
    },
    {
      name: "Amit Patel",
      role: "Real Estate Developer",
      content: "The best legal counsel I've ever worked with. Their strategic approach saved us millions. Truly exceptional service.",
      rating: 5,
      order: 3
    }
  ]

  for (const t of testimonials) {
    await prisma.testimonial.create({ data: t })
  }
  console.log('Testimonials created')

  // 5. Site Metrics
  const metrics = [
    { label: 'Happy Clients', value: '1000+', order: 1, icon: 'Users' },
    { label: 'Success Rate', value: '98%', order: 2, icon: 'TrendingUp' },
    { label: 'Years Experience', value: '20+', order: 3, icon: 'Calendar' }
  ]

  for (const m of metrics) {
    await prisma.siteMetric.create({ data: m })
  }
  console.log('Site metrics created')

  // 6. Site Settings (JSON based)
  const settings = [
    {
      key: 'brand_config',
      value: JSON.stringify({
        logo_text: 'SA',
        firm_name: 'Senior Advocate',
        firm_full_name: 'Senior Advocate Law Firm'
      })
    },
    {
      key: 'navigation_links',
      value: JSON.stringify([
        { name: 'Home', href: '/' },
        { name: 'About', href: '/about' },
        { name: 'Practice Areas', href: '/practice-areas' },
        { name: 'Blog', href: '/blog' },
        { name: 'Consultation', href: '/consultation' },
        { name: 'Contact', href: '/contact' }
      ])
    },
    {
      key: 'footer_config',
      value: JSON.stringify({
        description: 'Providing exceptional legal services with integrity, expertise, and dedication to justice for over two decades.',
        legal_disclaimer: 'The information provided on this website is for general informational purposes only and does not constitute legal advice.',
        office_hours: [
          'Monday - Friday: 9:00 AM - 6:00 PM',
          'Saturday: 10:00 AM - 2:00 PM',
          'Sunday: Closed'
        ]
      })
    },
    {
      key: 'hero_content',
      value: JSON.stringify({
        badge: 'Experienced Legal Counsel',
        title: 'Excellence in Legal Representation',
        subtitle: 'With over two decades of experience, we provide strategic legal solutions tailored to your unique needs.',
        cta_primary_text: 'Book Consultation',
        cta_primary_link: '/consultation',
        cta_secondary_text: 'Learn More',
        cta_secondary_link: '/about'
      })
    },
    {
      key: 'site_content',
      value: JSON.stringify(DEFAULT_SITE_CONTENT)
    }
  ]

  for (const setting of settings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting
    })
  }
  console.log('Site settings created')

  // 7. Sample Blogs
  const blogs = [
    {
      title: 'Understanding the New Digital Personal Data Protection Act',
      slug: 'dpdp-act-2024-guide',
      excerpt: 'A comprehensive look at how the latest data protection laws affect Indian businesses and individuals.',
      content: '<p>The Digital Personal Data Protection (DPDP) Act represents a significant shift in India\'s legal landscape...</p>',
      status: 'PUBLISHED',
      publishedAt: new Date()
    }
  ]

  for (const blog of blogs) {
    await prisma.blogPost.upsert({
      where: { slug: blog.slug },
      update: blog,
      create: blog
    })
  }
  console.log('Sample blogs created')

  console.log('Seeding completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
