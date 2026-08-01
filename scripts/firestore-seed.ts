import { adminAuth, adminDb } from "../lib/firebase-admin";
import * as bcrypt from "bcryptjs";
import {
  UserRole,
  AccountStatus,
  VendorCategory,
  PropertyType,
  ListingType,
  PriceUnit,
  PropertyStatus,
  LeadStatus,
  LeadSource,
  CommissionType,
  CommissionStatus,
} from "../types";

// Firebase Config check before running
const adminEmail = process.env.ADMIN_EMAIL || "dkpromotersproperty@gmail.com";

async function deleteCollection(collectionPath: string) {
  const collectionRef = adminDb.collection(collectionPath);
  const query = collectionRef.limit(100);
  
  // Recursively delete subcollections
  const snapshot = await query.get();
  if (snapshot.size === 0) return;

  const batch = adminDb.batch();
  for (const doc of snapshot.docs) {
    // Delete media subcollection if it exists for properties / profiles
    const subcols = await doc.ref.listCollections();
    for (const subcol of subcols) {
      const subSnap = await subcol.get();
      subSnap.docs.forEach((subDoc) => batch.delete(subDoc.ref));
    }
    batch.delete(doc.ref);
  }
  await batch.commit();
  await deleteCollection(collectionPath);
}

async function getOrCreateAuthUser(email: string, displayName: string, role: UserRole) {
  try {
    const user = await adminAuth.getUserByEmail(email);
    console.log(`User already exists in Firebase Auth: ${email}`);
    // Sync claims
    await adminAuth.setCustomUserClaims(user.uid, { role });
    return user.uid;
  } catch (err: any) {
    if (err.code === "auth/user-not-found") {
      const userRecord = await adminAuth.createUser({
        email,
        emailVerified: true,
        displayName,
        password: "Admin@2025", // temporary password
      });
      console.log(`Created Firebase Auth user: ${email}`);
      await adminAuth.setCustomUserClaims(userRecord.uid, { role });
      return userRecord.uid;
    }
    throw err;
  }
}

async function main() {
  console.log("Starting Firestore Seeding...");

  // Delete all collection documents
  const collections = [
    "users",
    "agentProfiles",
    "vendorProfiles",
    "properties",
    "leads",
    "leadNotes",
    "vendorEnquiries",
    "commissions",
    "blogPosts",
    "rateLimits",
    "verificationTokens",
  ];

  for (const col of collections) {
    console.log(`Cleaning collection: ${col}`);
    await deleteCollection(col);
  }
  console.log("All collections cleaned.");

  // 1. Admin User
  const adminUid = await getOrCreateAuthUser(adminEmail, "DK Promoters Admin", UserRole.ADMIN);
  const hashedAdminPassword = await bcrypt.hash("Admin@2025", 10);
  await adminDb.collection("users").doc(adminUid).set({
    name: "DK Promoters Admin",
    email: adminEmail,
    password: hashedAdminPassword,
    role: UserRole.ADMIN,
    accountStatus: AccountStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 2. Agent User
  const agentUid = await getOrCreateAuthUser("agent@dkpromoters.in", "Ramesh Broker", UserRole.AGENT);
  await adminDb.collection("users").doc(agentUid).set({
    name: "Ramesh Broker",
    email: "agent@dkpromoters.in",
    phone: "9876543210",
    role: UserRole.AGENT,
    accountStatus: AccountStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await adminDb.collection("agentProfiles").doc(agentUid).set({
    userId: agentUid,
    fullName: "Ramesh Broker",
    mobile: "9876543210",
    reraNumber: "TN/RERA/1234/2023",
    officeAddress: "12, RS Puram, Coimbatore",
    operatingCities: ["Coimbatore", "Tiruppur"],
    experience: 5,
    bio: "Expert in residential properties in Coimbatore.",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 3. Vendor User
  const vendorUid = await getOrCreateAuthUser("vendor@dkpromoters.in", "Kannan Builders", UserRole.VENDOR);
  await adminDb.collection("users").doc(vendorUid).set({
    name: "Kannan Builders",
    email: "vendor@dkpromoters.in",
    phone: "9988776655",
    role: UserRole.VENDOR,
    accountStatus: AccountStatus.ACTIVE,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await adminDb.collection("vendorProfiles").doc(vendorUid).set({
    userId: vendorUid,
    businessName: "Kannan Builders",
    ownerName: "Kannan",
    mobile: "9988776655",
    email: "vendor@dkpromoters.in",
    category: VendorCategory.BUILDER,
    description: "We are the best Builders in Coimbatore.",
    serviceAreas: ["Coimbatore"],
    yearsInBusiness: 5,
    isVerified: true,
    isFeatured: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 4. Sample Property
  const propRef = adminDb.collection("properties").doc();
  await propRef.set({
    title: "Luxury 3 BHK Villa",
    description: "Beautiful 3 BHK villa with modern amenities in RS Puram, Coimbatore.",
    type: PropertyType.VILLA,
    listingType: ListingType.SELL,
    price: 15000000,
    priceUnit: PriceUnit.TOTAL,
    area: 2400,
    bedrooms: 3,
    bathrooms: 3,
    address: "12, RS Puram, Coimbatore - 641002",
    locality: "RS Puram",
    city: "Coimbatore",
    district: "Coimbatore",
    pincode: "641002",
    amenities: ["Water Supply", "Security", "Car Parking"],
    isFeatured: true,
    status: PropertyStatus.ACTIVE,
    viewCount: 15,
    postedById: agentUid,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await propRef.collection("media").add({
    url: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c",
    type: "IMAGE",
    publicId: "sample_villa_image",
    order: 0,
    createdAt: new Date(),
  });

  // 5. Sample Lead
  const leadRef = await adminDb.collection("leads").add({
    propertyId: propRef.id,
    name: "John Doe",
    email: "john@example.com",
    message: "Interested in visiting the villa this weekend. Phone: 9876543211",
    status: LeadStatus.NEW,
    source: LeadSource.WEB,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  // 6. Sample Commission
  await adminDb.collection("commissions").add({
    propertyId: propRef.id,
    leadId: leadRef.id,
    type: CommissionType.PROPERTY_SALE,
    amount: 150000, // 1%
    status: CommissionStatus.EXPECTED,
    createdBy: adminUid,
    createdAt: new Date(),
  });

  // 7. Sample Blog Post
  await adminDb.collection("blogPosts").add({
    title: "Guide to Buying Real Estate in Tamil Nadu",
    slug: "guide-to-buying-real-estate-in-tamil-nadu",
    content: "<p>Buying property in Tamil Nadu is a major decision. Always verify RERA details before making any payment.</p>",
    excerpt: "Essential guide for home buyers in Tamil Nadu.",
    tags: ["Home Buying", "RERA"],
    authorId: adminUid,
    isPublished: true,
    publishedAt: new Date(),
    viewCount: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log("Seeding Completed Successfully!");
}

main().catch((err) => {
  console.error("Seeding Failed: ", err);
  process.exit(1);
});
