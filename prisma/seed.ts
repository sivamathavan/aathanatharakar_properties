import { PrismaClient, UserRole, AccountStatus, VendorCategory, PropertyType, ListingType, PriceUnit, PropertyStatus, LeadStatus, LeadSource, CommissionType, CommissionStatus } from '@prisma/client'
import * as bcrypt from 'bcryptjs'

import { prisma } from '../lib/prisma'

async function main() {
  console.log('Start seeding...')

  // Clean DB — wipe everything in correct order (child tables first)
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
  await prisma.session.deleteMany()
  await prisma.account.deleteMany()
  await prisma.verificationToken.deleteMany()
  await prisma.user.deleteMany()

  console.log('All existing data wiped.')

  // 1. Admin User
  const adminPassword = await bcrypt.hash('Admin@2025', 10)
  const admin = await prisma.user.create({
    data: {
      name: 'Aadana Tharakar Admin',
      email: 'aadanatharakarproperty@gmail.com',
      password: adminPassword,
      role: UserRole.ADMIN,
      accountStatus: AccountStatus.ACTIVE,
    },
  })
  console.log(`Created admin user: ${admin.email} (password: Admin@2025)`)

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
    {
      title: "Top 5 Localities to Buy a Flat in Coimbatore in 2025",
      slug: "top-5-localities-coimbatore-2025",
      excerpt: "Explore the highest-yielding residential neighborhoods in Coimbatore, from the tech corridors of Saravanampatti to the upscale streets of RS Puram.",
      coverImageUrl: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80",
      content: `
        <p class="mb-4">Coimbatore, known as the Manchester of South India, is rapidly developing into one of the most promising real estate destinations in Tamil Nadu. With the steady expansion of tech parks, manufacturing hubs, and educational institutions, residential demand has skyrocketed. Here are the top 5 localities to consider for purchasing a flat in 2025:</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">1. RS Puram (Rathinapuram)</h3>
        <p class="mb-4">As the premier shopping and residential zone in Coimbatore, RS Puram remains the gold standard for luxury living. Renowned for its wide tree-lined avenues, elite schools, and vibrant dining scene, property values here continue to appreciate steadily. Flats here offer exceptional rental yields and premium amenities.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">2. Saravanampatti</h3>
        <p class="mb-4">Commonly referred to as the IT Corridor of Coimbatore, Saravanampatti is home to major software parks (CHIL SEZ) housing thousands of professionals. This has triggered massive demand for modern apartments. If you are looking for high rental security and young tenant profiles, Saravanampatti is your best bet.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">3. Peelamedu</h3>
        <p class="mb-4">Peelamedu is the educational heart of Coimbatore, hosting prestigious institutions like PSG Tech and GRD. Its proximity to the Coimbatore International Airport and major hospitals makes it a highly convenient, central location for families and students alike.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">4. Vadavalli</h3>
        <p class="mb-4">Nestled at the foothills of the Western Ghats, Vadavalli is loved for its clean air, abundant groundwater, and pleasant climate. It has evolved from a quiet retirement suburb into a premium, family-friendly residential destination with excellent high-rise apartment options.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">5. Singanallur</h3>
        <p class="mb-4">Singanallur is the gateway to the eastern industrial zones of the city. With direct access to the Trichy Road and excellent public transportation networks, Singanallur is ideal for professionals working in logistics and manufacturing sectors.</p>
      `
    },
    {
      title: "Complete Guide to Renting a House in Tamil Nadu",
      slug: "guide-to-renting-tamil-nadu",
      excerpt: "Navigate the legalities of tenancy in Tamil Nadu—security deposits, model rental agreements, and RERA compliance guidelines.",
      coverImageUrl: "https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800&q=80",
      content: `
        <p class="mb-4">Renting a house seems straightforward, but understanding local tenancy guidelines and tenant rights is essential for a peaceful experience. Under the Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act, renting has become highly structured. Here is what you should know:</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">1. Written Tenancy Agreement</h3>
        <p class="mb-4">Verbal agreements are no longer legally valid. Every tenancy must be registered under a written agreement registered on the rent authority website. The agreement must state terms of rent, security deposits, lease period, and maintenance shares.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">2. Standard Security Deposits</h3>
        <p class="mb-4">Traditionally, landlords in Chennai and Coimbatore demand 10 months' rent as advance. However, new tenant acts recommend a maximum of 3 months' rent as advance for residential properties. Negotiating this standard up front is highly recommended.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">3. Maintenance and Repair Duties</h3>
        <p class="mb-4">Minor wear-and-tear repairs are typically the tenant's responsibility, while major structural integrity repairs, exterior painting, and plumbing replacements belong to the landlord. Clearly demarcating this in the lease clause prevents deposit disputes later.</p>
      `
    },
    {
      title: "Vastu Tips for Your New Home — Tamil Nadu Perspective",
      slug: "vastu-tips-new-home",
      excerpt: "Align your living space with traditional Vastu Shastra principles to foster prosperity, peace, and positive energy in your new home.",
      coverImageUrl: "https://images.unsplash.com/photo-1513584684374-8bab748fbf90?w=800&q=80",
      content: `
        <p class="mb-4">Vastu Shastra, the ancient Indian science of architecture, plays an integral role in Tamil Nadu home selections. Designing or selecting a flat that aligns with cardinal directions is believed to channel positive cosmic energy (Prana) and support family wellbeing.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">1. The Main Entrance (Eesanya or East)</h3>
        <p class="mb-4">The main door is the gateway for energy. Northeast, East, or North-facing entries are considered highly auspicious. Avoid south or southwest-facing entrances unless corrected with copper helixes or Vastu pyramids.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">2. Kitchen Placement (Agneya or Southeast)</h3>
        <p class="mb-4">The kitchen represents the fire element (Agni). Placing the kitchen in the southeast corner of the house is ideal. The cook should face East while preparing meals to invite healthy energy.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">3. Master Bedroom (Nairutya or Southwest)</h3>
        <p class="mb-4">The master bedroom should ideally be in the southwest corner to promote stability and peaceful sleep. Avoid placing bedrooms in the northeast, as it is a zone reserved for meditation and worship.</p>
      `
    },
    {
      title: "The Rise of Smart Homes in Chennai & Coimbatore",
      slug: "rise-of-smart-homes-tamil-nadu",
      excerpt: "How automated security, voice-activated appliances, and IoT energy management are reshaping luxury properties in major cities.",
      coverImageUrl: "https://images.unsplash.com/photo-1558036117-15d82a90b9b1?w=800&q=80",
      content: `
        <p class="mb-4">Modern home buyers are no longer satisfied with just physical square footage. The luxury property sector in Tamil Nadu is experiencing a paradigm shift towards connected, intelligent ecosystems—commonly known as Smart Homes.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">1. IoT and Integrated Automation</h3>
        <p class="mb-4">Imagine controlling your air conditioning, lighting levels, window blinds, and music systems with a simple voice command or via your mobile phone. High-end residential apartments in Chennai and Coimbatore are incorporating pre-fitted IoT hubs during construction.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">2. State-of-the-Art Home Security</h3>
        <p class="mb-4">Keyless entry systems, digital video doorbells with face recognition, and real-time motion alerts on your phone have replaced traditional padlocks. This level of automated safety is a major selling point for NRI buyers and tech professionals who travel frequently.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">3. Energy Management and Green Living</h3>
        <p class="mb-4">Smart thermostats and motion-activated energy grids optimize power usage, reducing monthly electricity bills by up to 25%. This alignment with eco-friendly sustainable development is appealing to conscious new-age buyers.</p>
      `
    },
    {
      title: "Understanding Patta and Chitta in Tamil Nadu Land Purchases",
      slug: "understanding-patta-chitta-tamil-nadu",
      excerpt: "A step-by-step guide to verifying revenue records, checking land ownership history, and transferring Patta in Tamil Nadu.",
      coverImageUrl: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=800&q=80",
      content: `
        <p class="mb-4">When purchasing agricultural land or independent plots in Tamil Nadu, verifying ownership requires checking documents beyond the simple sale deed. You must master the revenue documents: Patta and Chitta.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">What is Patta?</h3>
        <p class="mb-4">A Patta is a legal document issued by the Government of Tamil Nadu in the name of the rightful owner of the land. It contains records of the Patta Number, District, Taluk, Village, Survey Number, and exact Land Area.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">What is Chitta?</h3>
        <p class="mb-4">Chitta is a revenue document that classifies land into Nanjai (wetland/irrigated land) or Punjai (dry land). It provides details about the land classification and agricultural capabilities.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">How to Verify Patta Online</h3>
        <p class="mb-4">The Tamil Nadu government allows online verification of Patta and Chitta records through the official Anyvilla portal (eservices.tn.gov.in). Always verify that the seller's name matches the Patta record before finalizing the agreement.</p>
      `
    },
    {
      title: "Commercial Real Estate Trends: Coimbatore Tech Hubs",
      slug: "commercial-real-estate-coimbatore-tech",
      excerpt: "With major IT firms and startups expanding in Saravanampatti and Peelamedu, commercial office spaces are witnessing unprecedented demand.",
      coverImageUrl: "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&q=80",
      content: `
        <p class="mb-4">Coimbatore is witnessing a dramatic boom in its commercial real estate sector. Driven by a highly educated talent pool, lower operational costs, and excellent connectivity, top-tier global IT enterprises and nimble startups are expanding operations here.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">Coworking Spaces and Flexible Leases</h3>
        <p class="mb-4">Modern commercial occupiers are looking for plug-and-play flexible desks instead of taking on long-term capital leases. Coworking centers are popping up along Avinashi Road and Saravanampatti to cater to this need.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">Grade-A Commercial Infrastructure</h3>
        <p class="mb-4">Developers are launching international-grade commercial business parks with high-speed fiber networks, double-height lobbies, advanced central cooling, and ample multi-level parking. Investing in these commercial units offers steady rental yields of 8–11% per annum.</p>
      `
    },
    {
      title: "Pros and Cons of Buying Plots vs. Ready-to-Move Villas",
      slug: "buying-plots-vs-ready-villas",
      excerpt: "Compare the capital appreciation potential, customization freedom, and construction time of land parcels vs. modern ready villa projects.",
      coverImageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80",
      content: `
        <p class="mb-4">One of the most persistent dilemmas home buyers face in Tamil Nadu is choosing between purchasing a residential plot of land to build on, or buying a pre-constructed luxury villa in a gated community.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">Option A: Residential Plots</h3>
        <p class="mb-4"><strong>Pros:</strong> Absolute freedom to design your layout, choose specific materials, and supervise your custom construction. Land typically appreciates much faster than concrete buildings.<br>
        <strong>Cons:</strong> Chasing building approvals, managing contractors, and facing delayed timeframes can be stressful.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">Option B: Gated Community Villas</h3>
        <p class="mb-4"><strong>Pros:</strong> Zero construction hassle, instant move-in, and access to shared luxury amenities like swimming pools, parks, and around-the-clock gated security.<br>
        <strong>Cons:</strong> Limited customization choices, higher initial costs, and slower overall capital appreciation rates.</p>
      `
    },
    {
      title: "Home Loan Documentation Checklist for Indian Salaried Buyers",
      slug: "home-loan-documentation-checklist",
      excerpt: "Be launch-ready for your home loan application. Here are the exact income documents, legal papers, and KYC files banks demand.",
      coverImageUrl: "https://images.unsplash.com/photo-1434626881859-194d67b2b86f?w=800&q=80",
      content: `
        <p class="mb-4">Securing the best home loan interest rate requires presenting a meticulously organized document file to banks. For salaried professionals in India, keeping these files ready avoids long processing delays:</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">1. KYC Documents</h3>
        <p class="mb-4">Proof of Identity and Address: PAN Card, Aadhaar Card, Passport, or Voter ID. Make sure information is consistent across all cards.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">2. Income Credentials</h3>
        <p class="mb-4">Salary Slips for the last 3 months, Form 16 for the last 2 assessment years, and complete Bank Statements for the last 6 months showing salary credits.</p>
        
        <h3 class="text-lg font-bold mt-6 mb-2 text-navy-900">3. Property Documents</h3>
        <p class="mb-4">Parent deed history, current sale agreement, building approval plan from DTCP/CMDA, and the latest Encumbrance Certificate (EC) showing clear title.</p>
      `
    }
  ]

  for (const b of blogs) {
    await prisma.blogPost.create({
      data: {
        title: b.title,
        slug: b.slug,
        content: b.content.trim(),
        excerpt: b.excerpt,
        coverImageUrl: b.coverImageUrl,
        authorId: admin.id,
        isPublished: true,
        publishedAt: new Date(),
      }
    })
  }
  console.log(`Created ${blogs.length} premium blog posts.`)

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
