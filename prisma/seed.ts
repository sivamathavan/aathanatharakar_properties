import { PrismaClient, UserRole, AccountStatus, VendorCategory, PropertyType, ListingType, PriceUnit, PropertyStatus, LeadStatus, LeadSource, CommissionType, CommissionStatus } from '@prisma/client'
import * as bcrypt from 'bcrypt'

import { prisma } from '../lib/prisma'

async function main() {
  console.log('Start seeding...')

  // Clean DB
  await prisma.commission.deleteMany()
  await prisma.vendorEnquiry.deleteMany()
  await prisma.leadNote.deleteMany()
  await prisma.lead.deleteMany()
  await prisma.propertyMedia.deleteMany()
  await prisma.property.deleteMany()
  await prisma.vendorMedia.deleteMany()
  await prisma.vendorProfile.deleteMany()
  await prisma.agentProfile.deleteMany()
  await prisma.blogPost.deleteMany()
  await prisma.user.deleteMany()

  // 1. Admin User
  const adminPassword = await bcrypt.hash('Admin@2025', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@aadanatharakar.in',
      password: adminPassword,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
      // For NextAuth credentials provider we might need a separate password field or handle it differently, 
      // but according to schema there is no password field.
      // Wait, there is no password field in User model! 
      // I will add an optional password field to the User model so admin can login.
    },
  })
  console.log(`Created admin user: ${admin.email}`)

  // 2. Agent User
  const agentUser = await prisma.user.create({
    data: {
      name: 'Ramesh Broker',
      email: 'ramesh@example.com',
      role: UserRole.AGENT,
      accountStatus: AccountStatus.ACTIVE,
      agentProfile: {
        create: {
          fullName: 'Ramesh Broker',
          mobile: '9876543210',
          reraNumber: 'TN/RERA/1234/2023',
          officeAddress: '12, RS Puram, Coimbatore',
          operatingCities: ['Coimbatore', 'Tiruppur'],
          experience: 5,
          bio: 'Expert in residential properties in Coimbatore.',
        }
      }
    }
  })
  console.log(`Created agent user: ${agentUser.email}`)

  // 3. Vendor Users (8 profiles)
  const vendors = [
    { name: 'Kannan Builders', email: 'kannan@example.com', category: VendorCategory.BUILDER },
    { name: 'Elite Interiors', email: 'elite@example.com', category: VendorCategory.INTERIOR_DESIGNER },
    { name: 'Siva Painters', email: 'siva@example.com', category: VendorCategory.PAINTER },
    { name: 'Bright Electricians', email: 'bright@example.com', category: VendorCategory.ELECTRICIAN },
    { name: 'Quick Plumbers', email: 'quick@example.com', category: VendorCategory.PLUMBER },
    { name: 'Vedic Vastu', email: 'vastu@example.com', category: VendorCategory.VASTU_CONSULTANT },
    { name: 'Easy Home Loans', email: 'loans@example.com', category: VendorCategory.HOME_LOAN_ADVISOR },
    { name: 'Safe Movers', email: 'movers@example.com', category: VendorCategory.MOVERS_PACKERS },
  ]

  for (const v of vendors) {
    await prisma.user.create({
      data: {
        name: v.name,
        email: v.email,
        role: UserRole.VENDOR,
        accountStatus: AccountStatus.ACTIVE,
        vendorProfile: {
          create: {
            businessName: v.name,
            ownerName: v.name.split(' ')[0],
            mobile: '9988776655',
            email: v.email,
            category: v.category,
            description: `We are the best ${v.category.toLowerCase().replace('_', ' ')} in Coimbatore.`,
            serviceAreas: ['Coimbatore'],
            yearsInBusiness: Math.floor(Math.random() * 10) + 1,
            isVerified: true,
          }
        }
      }
    })
  }
  console.log(`Created 8 vendors.`)

  // 4. Properties (10 across Coimbatore)
  const propertiesData = [
    { title: '3BHK Apartment in Gandhipuram', type: PropertyType.APARTMENT, listing: ListingType.SELL, price: 6500000, locality: 'Gandhipuram' },
    { title: 'Luxury 2BHK in RS Puram', type: PropertyType.APARTMENT, listing: ListingType.SELL, price: 7500000, locality: 'RS Puram' },
    { title: 'Spacious 3BHK in Peelamedu', type: PropertyType.APARTMENT, listing: ListingType.SELL, price: 5500000, locality: 'Peelamedu' },
    { title: 'Independent Villa in Saravanampatti', type: PropertyType.VILLA, listing: ListingType.SELL, price: 12000000, locality: 'Saravanampatti' },
    { title: 'Modern Villa in Kalapatti', type: PropertyType.VILLA, listing: ListingType.SELL, price: 15000000, locality: 'Kalapatti' },
    { title: 'Corner Plot in Kalapatti', type: PropertyType.PLOT, listing: ListingType.SELL, price: 3000000, locality: 'Kalapatti' },
    { title: 'Residential Plot in Vilankurichi', type: PropertyType.PLOT, listing: ListingType.SELL, price: 2500000, locality: 'Vilankurichi' },
    { title: 'Commercial Office Space in RS Puram', type: PropertyType.COMMERCIAL, listing: ListingType.RENT, price: 40000, locality: 'RS Puram', unit: PriceUnit.PER_MONTH },
    { title: 'Shop for Rent in Peelamedu', type: PropertyType.COMMERCIAL, listing: ListingType.RENT, price: 25000, locality: 'Peelamedu', unit: PriceUnit.PER_MONTH },
    { title: '3BHK House for Lease in Ganapathy', type: PropertyType.HOUSE, listing: ListingType.LEASE, price: 500000, locality: 'Ganapathy' },
  ]

  let propertyId = null;

  for (const p of propertiesData) {
    const prop = await prisma.property.create({
      data: {
        title: p.title,
        description: 'Excellent property located in a prime area with all basic amenities nearby.',
        type: p.type,
        listingType: p.listing,
        price: p.price,
        priceUnit: p.unit || PriceUnit.TOTAL,
        area: p.type === PropertyType.PLOT ? 1200 : 1500,
        bedrooms: (p.type === PropertyType.APARTMENT || p.type === PropertyType.VILLA || p.type === PropertyType.HOUSE) ? 3 : null,
        bathrooms: (p.type === PropertyType.APARTMENT || p.type === PropertyType.VILLA || p.type === PropertyType.HOUSE) ? 3 : null,
        address: `123 Main Street, ${p.locality}`,
        locality: p.locality,
        city: 'Coimbatore',
        district: 'Coimbatore',
        status: PropertyStatus.ACTIVE,
        postedById: agentUser.id,
        amenities: ['Car Parking', '24/7 Water', 'Security'],
      }
    })
    propertyId = prop.id;
  }
  console.log(`Created 10 properties.`)

  // 5. Blog Posts
  const blogs = [
    { title: "Top 5 Localities to Buy a Flat in Coimbatore in 2025", slug: "top-5-localities-coimbatore-2025" },
    { title: "Complete Guide to Renting a House in Tamil Nadu", slug: "guide-to-renting-tamil-nadu" },
    { title: "Vastu Tips for Your New Home — Tamil Nadu Perspective", slug: "vastu-tips-new-home" },
  ]

  for (const b of blogs) {
    await prisma.blogPost.create({
      data: {
        title: b.title,
        slug: b.slug,
        content: `<p>This is the content for ${b.title}. It provides great insights.</p>`,
        excerpt: 'A brief summary of the blog post.',
        authorId: admin.id,
        isPublished: true,
      }
    })
  }
  console.log(`Created 3 blog posts.`)

  // 6. Leads
  const leadsData = [
    { status: LeadStatus.NEW },
    { status: LeadStatus.NEW },
    { status: LeadStatus.CONTACTED },
    { status: LeadStatus.SITE_VISIT },
    { status: LeadStatus.CLOSED },
  ]

  for (let i = 0; i < leadsData.length; i++) {
    await prisma.lead.create({
      data: {
        name: `Lead ${i + 1}`,
        email: `lead${i + 1}@example.com`,
        message: 'I am interested in this property.',
        status: leadsData[i].status,
        propertyId: propertyId, // assign to the last created property
        source: LeadSource.WEB,
      }
    })
  }
  console.log(`Created 5 leads.`)

  // 7. Commissions
  await prisma.commission.create({
    data: {
      type: CommissionType.PROPERTY_SALE,
      amount: 75000,
      status: CommissionStatus.RECEIVED,
      createdBy: admin.id,
      notes: 'Commission for sale of apartment.'
    }
  })

  await prisma.commission.create({
    data: {
      type: CommissionType.INTERIOR_REFERRAL,
      amount: 15000,
      status: CommissionStatus.EXPECTED,
      createdBy: admin.id,
      notes: 'Expected referral bonus from Elite Interiors.'
    }
  })
  console.log(`Created 2 commissions.`)

  console.log('Seeding finished.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
