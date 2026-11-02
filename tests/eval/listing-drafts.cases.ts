// Test listings for "speak or paste your listing", with the answers a careful
// agent would expect in the form. Used by tests/eval/listing-draft-eval.ts to
// compare models. Mix of English, Tamil, Tanglish, speech-recognition slips and
// WhatsApp forwards, plus cases where the right answer is "not stated".

export interface ExpectedArea {
  area: number;
  unit: "SQFT" | "CENT" | "ACRE" | "GROUND";
}

export interface DraftCase {
  id: string;
  text: string;
  writeIn: "en" | "ta";
  expect: {
    type: string | null;
    listingType: string | null | (string | null)[]; // a list = any of them is right
    price: number | null; // null = must be left empty (not stated)
    priceUnit?: string | null;
    area?: ExpectedArea | ExpectedArea[] | null; // several = any of them is right
    bedrooms?: number | null;
    bathrooms?: number | null;
    city: string | null | (string | null)[]; // a list = any of them is right
    locality?: string[]; // any of these spellings (dots/spaces ignored)
    ownerName?: string | null;
    ownerPhone?: string | null; // digits only
    surveyNumber?: string; // must appear
  };
}

export const CASES: DraftCase[] = [
  {
    id: "en-plot-whatsapp",
    text: "5 cent DTCP plot for sale in Vadavalli, Coimbatore. 30 ft road, east facing. Price 28 lakhs. Patta ready. Owner Murugan 9842012345.",
    writeIn: "en",
    expect: { type: "PLOT", listingType: "BUY", price: 2800000, priceUnit: "TOTAL", area: { area: 5, unit: "CENT" }, city: "Coimbatore", locality: ["Vadavalli"], ownerName: "Murugan", ownerPhone: "9842012345" },
  },
  {
    id: "ta-house-sale",
    text: "மதுரை கே.கே நகரில் 3 BHK தனி வீடு விற்பனைக்கு, 1800 சதுர அடி, விலை 95 லட்சம்",
    writeIn: "ta",
    expect: { type: "HOUSE", listingType: "BUY", price: 9500000, priceUnit: "TOTAL", area: { area: 1800, unit: "SQFT" }, bedrooms: 3, city: "Madurai", locality: ["KK Nagar", "கே.கே நகர்", "கே.கே. நகர்"] },
  },
  {
    id: "en-flat-rent",
    text: "2BHK flat for rent in Anna Nagar Chennai, 1100 sqft, rent 28k per month, advance 3 lakhs, 2 bathrooms, car parking",
    writeIn: "en",
    expect: { type: "APARTMENT", listingType: "RENT", price: 28000, priceUnit: "PER_MONTH", area: { area: 1100, unit: "SQFT" }, bedrooms: 2, bathrooms: 2, city: "Chennai", locality: ["Anna Nagar"] },
  },
  {
    id: "tanglish-site-rate-per-cent",
    text: "Salem la 10 cent house site virkkanum, cent ku 4 lakh rate, Omalur main road pakkathula",
    writeIn: "en",
    expect: { type: "PLOT", listingType: "BUY", price: 4000000, priceUnit: "TOTAL", area: { area: 10, unit: "CENT" }, city: "Salem", locality: ["Omalur", "Omalur Main Road", "Omalur Road"] },
  },
  {
    id: "en-coconut-farm",
    text: "3 acre coconut thoppu near Pollachi, borewell, EB connection, 1.2 crore",
    writeIn: "en",
    expect: { type: "FARM_LAND", listingType: "BUY", price: 12000000, priceUnit: "TOTAL", area: { area: 3, unit: "ACRE" }, city: "Pollachi" },
  },
  {
    id: "tanglish-othi-lease",
    text: "Trichy Srirangam la 2 BHK veedu lease ku, 5 lakh othi",
    writeIn: "ta",
    expect: { type: "HOUSE", listingType: "LEASE", price: 500000, priceUnit: "TOTAL", bedrooms: 2, city: "Trichy", locality: ["Srirangam", "ஸ்ரீரங்கம்"] },
  },
  {
    id: "en-shop-kovai",
    text: "Shop for rent in Gandhipuram, Kovai, 400 sqft, ground floor, rent 35000/month",
    writeIn: "en",
    expect: { type: "COMMERCIAL", listingType: "RENT", price: 35000, priceUnit: "PER_MONTH", area: { area: 400, unit: "SQFT" }, city: "Coimbatore", locality: ["Gandhipuram"] },
  },
  {
    id: "en-villa-per-sqft",
    text: "Villa in Saravanampatti Coimbatore, 2400 sqft, rate 6500 per sqft, 4 bedrooms",
    writeIn: "en",
    expect: { type: "VILLA", listingType: "BUY", price: 6500, priceUnit: "PER_SQFT", area: { area: 2400, unit: "SQFT" }, bedrooms: 4, city: "Coimbatore", locality: ["Saravanampatti"] },
  },
  {
    id: "en-ground-tambaram",
    text: "1 ground plot in Tambaram Chennai for sale, 1.1 crore",
    writeIn: "en",
    expect: { type: "PLOT", listingType: "BUY", price: 11000000, priceUnit: "TOTAL", area: [{ area: 1, unit: "GROUND" }, { area: 2400, unit: "SQFT" }], city: "Chennai", locality: ["Tambaram"] },
  },
  {
    id: "en-no-price",
    text: "Independent house for sale in Tirunelveli Palayamkottai, 1200 sqft, 2 bedrooms, call for price",
    writeIn: "en",
    expect: { type: "HOUSE", listingType: "BUY", price: null, area: { area: 1200, unit: "SQFT" }, bedrooms: 2, city: "Tirunelveli", locality: ["Palayamkottai"] },
  },
  {
    id: "en-city-not-in-list",
    text: "Plot in Gobichettipalayam, 6 cents, 18 lakhs",
    writeIn: "en",
    expect: { type: "PLOT", listingType: "BUY", price: 1800000, priceUnit: "TOTAL", area: { area: 6, unit: "CENT" }, city: null, locality: ["Gobichettipalayam", "Gobi"] },
  },
  {
    id: "ta-speech-english-words",
    text: "கோயம்புத்தூர் பீளமேடு ல டூ பிஎச்கே பிளாட் வாடகைக்கு ரெண்ட் பதினெட்டாயிரம்",
    writeIn: "ta",
    expect: { type: "APARTMENT", listingType: "RENT", price: 18000, priceUnit: "PER_MONTH", bedrooms: 2, city: "Coimbatore", locality: ["Peelamedu", "பீளமேடு"] },
  },
  {
    id: "en-godown-rent",
    text: "Godown for rent near Hosur SIPCOT, 10000 sq ft, rent 1.5 lakh per month",
    writeIn: "en",
    expect: { type: "WAREHOUSE", listingType: "RENT", price: 150000, priceUnit: "PER_MONTH", area: { area: 10000, unit: "SQFT" }, city: "Hosur", locality: ["SIPCOT", "Hosur SIPCOT", "Near SIPCOT", "near Hosur SIPCOT"] },
  },
  {
    id: "en-whatsapp-forward-emoji",
    text: "🏡🏡 *FOR SALE* 🏡🏡\n📍 Thanjavur, Medical College Road\n✅ 1 ground plot (2400 sqft)\n✅ North facing, 40 ft road\n💰 Price: 72 L (negotiable)\nContact owner Mr. Selvam 94430 55667",
    writeIn: "en",
    expect: { type: "PLOT", listingType: "BUY", price: 7200000, priceUnit: "TOTAL", area: [{ area: 1, unit: "GROUND" }, { area: 2400, unit: "SQFT" }], city: "Thanjavur", locality: ["Medical College Road"], ownerName: "Selvam", ownerPhone: "9443055667" },
  },
  {
    id: "en-pg",
    text: "Ladies PG in Velachery Chennai, 6500 per month with food",
    writeIn: "en",
    expect: { type: "PG_HOSTEL", listingType: "RENT", price: 6500, priceUnit: "PER_MONTH", city: "Chennai", locality: ["Velachery"] },
  },
  {
    id: "ta-mango-farm-rate-per-acre",
    text: "திண்டுக்கல் அருகே 5 ஏக்கர் மாந்தோப்பு விற்பனைக்கு, ஏக்கருக்கு 12 லட்சம்",
    writeIn: "ta",
    expect: { type: "FARM_LAND", listingType: "BUY", price: 6000000, priceUnit: "TOTAL", area: { area: 5, unit: "ACRE" }, city: "Dindigul" },
  },
  {
    id: "en-omr-apartment-city-unstated",
    text: "3BHK apartment in OMR Sholinganallur, 1650 sqft, 1.35 Cr, 2 car parks, gym, pool",
    writeIn: "en",
    expect: { type: "APARTMENT", listingType: "BUY", price: 13500000, priceUnit: "TOTAL", area: { area: 1650, unit: "SQFT" }, bedrooms: 3, city: ["Chennai", null], locality: ["Sholinganallur", "OMR Sholinganallur", "Sholinganallur, OMR"] },
  },
  {
    id: "tanglish-house-rent-erode",
    text: "Erode Perundurai road la 3 BHK independent house rent ku, 15000 rent, 1 lakh advance",
    writeIn: "en",
    expect: { type: "HOUSE", listingType: "RENT", price: 15000, priceUnit: "PER_MONTH", bedrooms: 3, city: "Erode", locality: ["Perundurai Road", "Perundurai"] },
  },
  {
    id: "en-agri-survey-owner",
    text: "Kanchipuram, Walajabad: 50 cents agricultural land, S.F. No. 245/2B, price 35 lakhs total, owner Kumar 9790012345",
    writeIn: "en",
    expect: { type: "FARM_LAND", listingType: "BUY", price: 3500000, priceUnit: "TOTAL", area: { area: 50, unit: "CENT" }, city: "Kanchipuram", locality: ["Walajabad"], ownerName: "Kumar", ownerPhone: "9790012345", surveyNumber: "245/2B" },
  },
  {
    id: "en-too-short",
    text: "plot in Vellore",
    writeIn: "en",
    expect: { type: "PLOT", listingType: ["BUY", null], price: null, area: null, bedrooms: null, city: "Vellore", ownerName: null, ownerPhone: null },
  },
];
