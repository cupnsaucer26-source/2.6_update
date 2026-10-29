/**
 * SATHYAM AGRO MART — PERSONALIZED AI FARMING ASSISTANT ENGINE
 * 
 * Context-aware conversation, dynamic suggestion generation, 
 * live catalog product grounding, and agronomy expert triage.
 */

// Rate limits and timeouts
const MINUTE_MS = 60 * 1000;
const MAX_TURNS_CONTEXT = 6;

/**
 * Normalizes text to lower case and strips punctuation.
 */
function normalizeText(str) {
  return String(str || '').toLowerCase().trim();
}

/**
 * Assembles bounded context from available, authorized project data.
 */
export async function assembleFarmerContext({ user, message, history = [], db }) {
  // 1. Farmer Profile Context (Only authorized authenticated user)
  let profile = null;
  if (user) {
    profile = {
      name: user.name || 'Farmer',
      crop: user.crop || null,
      crops: Array.isArray(user.crops) ? user.crops : (user.crop ? [user.crop] : []),
      acreage: user.acreage || null,
      village: user.village || null,
      district: user.district || null,
      state: user.state || null
    };
  }

  // 2. Order History & Purchased Products (Only authorized authenticated user)
  let recentPurchases = [];
  if (user && typeof db.getOrdersForCustomer === 'function') {
    try {
      const orders = await db.getOrdersForCustomer(user);
      if (Array.isArray(orders)) {
        for (const ord of orders.slice(0, 5)) {
          if (Array.isArray(ord.items)) {
            for (const item of ord.items) {
              recentPurchases.push({
                productName: item.name,
                productId: item.id,
                qty: item.qty,
                packSize: item.packSize || '',
                orderDate: ord.createdAt ? ord.createdAt.slice(0, 10) : '',
                deliveryStatus: ord.deliveryStatus || ord.paymentStatus || 'Completed'
              });
            }
          }
        }
      }
    } catch {
      // Non-blocking for orders
    }
  }

  // 3. Authoritative Live Catalog Grounding
  let products = [];
  if (typeof db.getProducts === 'function') {
    try {
      products = await db.getProducts({ onlineOnly: true });
    } catch {}
  }
  if (!Array.isArray(products)) products = [];

  // Relevance matching: Rank products by topic, crop, and disease keywords
  const contextQuery = [
    message,
    ...(history || []).map(h => h.text || h.content || ''),
    profile?.crop || ''
  ].join(' ').toLowerCase();

  const terms = contextQuery.split(/[\s,./?]+/).filter(t => t.length > 2);

  const scored = products.map(p => {
    let score = 0;
    const name = normalizeText(p.name);
    const crops = Array.isArray(p.crops) ? p.crops.join(' ').toLowerCase() : normalizeText(p.crops);
    const pests = Array.isArray(p.diseases) ? p.diseases.join(' ').toLowerCase() : normalizeText(p.diseases || p.targetPests);
    const category = normalizeText(p.category);
    const active = normalizeText(p.activeIngredient);

    // Profile crop affinity
    if (profile?.crop && crops.includes(profile.crop.toLowerCase())) {
      score += 3;
    }

    for (const term of terms) {
      if (pests.includes(term)) score += 6;
      if (name.includes(term)) score += 5;
      if (crops.includes(term)) score += 4;
      if (category.includes(term)) score += 2;
      if (active.includes(term)) score += 2;
    }

    return { product: p, score };
  });

  scored.sort((a, b) => b.score - a.score);
  // Cap at 15 most relevant products to prevent context overflow
  const relevantProducts = scored.slice(0, 15).map(s => s.product);

  return {
    profile,
    recentPurchases,
    relevantProducts,
    totalProductsCount: products.length
  };
}

/**
 * Builds the comprehensive prompt for Gemini AI model.
 */
export function buildSystemPrompt({ profile, recentPurchases, relevantProducts, lang = 'en' }) {
  const catalogList = relevantProducts.map(p => {
    const crops = Array.isArray(p.crops) ? p.crops.join(', ') : (p.crops || 'All Crops');
    const pests = Array.isArray(p.diseases) ? p.diseases.join(', ') : (p.diseases || p.targetPests || 'General');
    const active = p.activeIngredient || 'Not specified';
    const dose = p.dosage || 'Refer to pack';
    const price = p.price ? `₹${p.price}` : 'Price on request';
    return `- Product: "${p.name}" (ID: ${p.id}) | Category: ${p.category || 'Agro'} | Target Crops: ${crops} | Pests/Diseases: ${pests} | Active: ${active} | Dosage: ${dose} | Price: ${price}`;
  }).join('\n');

  let profileSection = 'Farmer: Guest / Visitor (No saved farm profile).';
  if (profile) {
    profileSection = `Authenticated Farmer Profile:
- Name: ${profile.name}
- Registered Primary Crop: ${profile.crop || 'Not specified'}
- Farm Acreage: ${profile.acreage ? `${profile.acreage} acres` : 'Not specified'}
- Location: ${[profile.village, profile.district, profile.state].filter(Boolean).join(', ') || 'South India'}`;
  }

  let purchasesSection = 'No prior purchase history on record.';
  if (recentPurchases.length > 0) {
    purchasesSection = `Recent Authorized Purchases:
` + recentPurchases.map(p => `- Purchased "${p.productName}" (ID: ${p.productId}, Pack: ${p.packSize}) on ${p.orderDate} [Status: ${p.deliveryStatus}]`).join('\n');
  }

  const cleanLang = String(lang || 'en').trim().toLowerCase().slice(0, 5);

  const langDirectives = {
    en: `STRICT LANGUAGE DIRECTIVE:
- The website is currently set to ENGLISH.
- You MUST respond ONLY in clear, natural, professional ENGLISH.
- NEVER use Tamil, Tanglish, Hindi, Telugu, or Kannada words, phrases, or greetings (e.g. do NOT say "வணக்கம்", "விவசாயி", "thala", "makkacholam", or mix regional grammar).
- Use respectful English farmer greetings such as "Hello Farmer!" or "Welcome Farmer!".
- All explanations, diagnoses, symptoms, dosages, follow-up questions, and selectable suggestion labels MUST be 100% in English.`,

    ta: `STRICT LANGUAGE DIRECTIVE:
- The website is currently set to TAMIL (தமிழ்).
- You MUST respond in clear, fluent, natural TAMIL (தமிழ்).
- Use respectful farmer greeting "வணக்கம் விவசாயி!".
- Explain diagnoses, symptoms, remedies, and dosages in proper Tamil script (தமிழ்).
- All follow-up questions and selectable suggestion labels MUST be in Tamil.`,

    te: `STRICT LANGUAGE DIRECTIVE:
- The website is currently set to TELUGU (తెలుగు).
- You MUST respond in clear, fluent, natural TELUGU (తెలుగు).
- Use respectful farmer greeting "నమస్కారం రైతు సోదరా!".
- Explain diagnoses, symptoms, remedies, and dosages in Telugu script.
- All follow-up questions and selectable suggestion labels MUST be in Telugu.`,

    kn: `STRICT LANGUAGE DIRECTIVE:
- The website is currently set to KANNADA (ಕನ್ನಡ).
- You MUST respond in clear, fluent, natural KANNADA (ಕನ್ನಡ).
- Use respectful farmer greeting "ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ!".
- Explain diagnoses, symptoms, remedies, and dosages in Kannada script.
- All follow-up questions and selectable suggestion labels MUST be in Kannada.`,

    hi: `STRICT LANGUAGE DIRECTIVE:
- The website is currently set to HINDI (हिन्दी).
- You MUST respond in clear, fluent, natural HINDI (हिन्दी).
- Use respectful farmer greeting "नमस्ते किसान भाई!".
- Explain diagnoses, symptoms, remedies, and dosages in Hindi (Devanagari script).
- All follow-up questions and selectable suggestion labels MUST be in Hindi.`
  };

  const activeDirective = langDirectives[cleanLang] || langDirectives.en;

  return `You are the official Senior Agronomy AI Doctor for Sathyam Agro Mart ("சத்யம் அக்ரோ மார்ட்"), South India's trusted agri-inputs and farmer advisory platform.

MISSION & BEHAVIOR:
1. Provide practical, accurate, honest agronomic advice to Indian farmers for crop diseases, pests, soil fertility, and fertilizers.
2. Ground all recommendations strictly in the Sathyam Agro Mart live catalog provided below.
3. NEVER fabricate chemical brands, active ingredients, or unverified claims.
4. If a symptom is ambiguous (e.g. "paddy leaves turning yellow"), DO NOT guess a single diagnosis with false confidence. State plausible possibilities, ask ONE clear clarifying question, and provide 3-4 selectable suggestion options.
5. If the problem is severe, widespread, or uncertain, recommend booking an expert consultation with our human agronomy specialists: [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]].
6. Farmers read answers on mobile phones, often in sunlight. Keep answers under 130 words.
7. ${activeDirective}

MANDATORY AGRONOMIC SAFETY & EVIDENCE PROTOCOL:
a. Soil Alkalinity & Gypsum: NEVER invent a flat kg/acre dosage for gypsum or lime. Gypsum requirement depends strictly on laboratory Exchangeable Sodium Percentage (ESP) and soil texture. State that soil with pH > 8.0 needs gypsum calculated from a soil test, and invite the farmer to upload their test at [[PAGE:/soil-test-report:Check Soil Health Report]] or [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]].
b. Pesticide Tank Mixing: NEVER confirm that two chemical pesticides or a pesticide and foliar fertilizer can be mixed unless stated on the bottle label. Warn that incompatible tank mixes cause leaf scorch (phytotoxicity) or reduced efficacy. Always recommend a physical jar test and consulting our agronomy team.
c. Pre-Harvest Intervals (PHI): On edible vegetables, fruits, and harvest-ready crops, always remind farmers to observe the Pre-Harvest Interval (waiting period between last spray and harvest) printed on the chemical bottle label to avoid harmful residues.
d. Spray Scorch / Phytotoxicity: If leaves show scorching or margin burn post-spray, prescribe immediate clean water foliar rinsing and ensuring soil root moisture. Do not recommend heavy chemical foliar sprays on scorched foliage. Recommend [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]].
e. Organic Slurry / Manures: State that cow dung slurry or Jeevamrutha must be properly fermented (48-72 hours) and diluted with irrigation water, as applying raw unfermented manure directly to crop roots causes rhizosphere fermentation heat and pathogen risks.
f. Product-Specific Dosages: When citing Sathyam Agro Mart products, quote strictly the dosage from the authorized catalogue below. If not listed, advise checking the pack label.
g. Consultation Clarification: Consultations are scheduled appointments on preferred dates and slots (10 AM - 6 PM) with our certified specialists. Never imply an immediate live robot or human chat takeover. Use [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]].

STORE POLICIES & LINKS:
- Free delivery on orders above ₹999. Cash on Delivery (COD) available.
- Soil Health Analysis: [[PAGE:/soil-test-report:Check Soil Health Report]]
- Senior Agronomist Callback: [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]]
- Product Action tag: [[PRODUCT:productId:ShortProductName]] (e.g. [[PRODUCT:sb-01:BlastShield 75 WP]])

${profileSection}

${purchasesSection}

AUTHORIZED RELEVANT CATALOGUE:
${catalogList || 'No catalog items matching search.'}

OUTPUT FORMAT:
You MUST respond with valid JSON matching this schema:
{
  "reply": "Clear, grounded response in farmer's language, including [[PRODUCT:...]] tags where relevant",
  "followUp": "Single targeted follow-up question if more info is needed, otherwise empty string",
  "suggestions": [
    { "id": "symptom_1", "label": "Short selectable symptom or answer", "category": "symptom|action|crop" }
  ],
  "offerExpert": true or false,
  "expertReason": "Short reason if expert consultation is recommended, otherwise empty string",
  "detectedCrop": "Paddy|Cotton|Sugarcane|Chilli|Vegetables|General",
  "detectedTopic": "Pest|Disease|Nutrient|Weed|Soil|Product|General"
}`;
}

/**
 * Deterministic fallback engine for when Gemini is offline, rate-limited, or API key is unset.
 */
export function generateDeterministicFallback({ message, profile, recentPurchases, relevantProducts, lang = 'en' }) {
  const text = normalizeText(message);
  const crop = profile?.crop || 'Paddy/Rice';
  const cleanLang = String(lang || 'en').trim().toLowerCase().slice(0, 5);

  // Helper to find catalog product by keyword
  const findProd = (kw) => {
    const k = normalizeText(kw);
    return relevantProducts.find(p =>
      normalizeText(p.name).includes(k) ||
      normalizeText(p.diseases).includes(k) ||
      normalizeText(p.targetPests).includes(k) ||
      normalizeText(p.crops).includes(k)
    ) || relevantProducts[0] || { id: 'sb-01', name: 'Sathyam Agro Remedy' };
  };

  // 1. Paddy Leaf Yellowing / Blast
  if (text.includes('yellow') || text.includes('blast') || text.includes('paddy') || text.includes('நெல்') || text.includes('மஞ்சள்')) {
    const blastProd = findProd('blast');
    const rootProd = findProd('root') || findProd('vigor');
    if (cleanLang === 'ta') {
      return {
        reply: `🌾 **நெல் இலை மஞ்சள் & கருகல் நோய் கண்டறிதல்:**
நெல்லில் இலை மஞ்சள் நிறமாக மாறுவதற்கு இரு முக்கிய காரணங்கள் உண்டு:
1. **நைட்ரஜன் அல்லது நுண்ணூட்டச்சத்து குறைபாடு:** அடி இலைகளில் தொடங்கி வெளிர் மஞ்சள் நிறமாக மாறும். இதற்கு [[PRODUCT:${rootProd.id}:${rootProd.name}]] பரிந்துரைக்கப்படுகிறது.
2. **நெல் இலை கருகல் (பிளாஸ்ட் - Pyricularia oryzae):** இலைகளில் கண் வடிவ பழுப்பு நிற புள்ளிகள் தோன்றும். இதற்கு [[PRODUCT:${blastProd.id}:${blastProd.name}]] @ 150 கிராம்/ஏக்கர் தெளிக்கவும்.

பயிர் பாதுகாப்பு குறிப்பு: மேகமூட்டமான காலங்களில் அதிக நைட்ரஜன் உரமிடுவதைத் தவிர்க்கவும்.`,
        followUp: 'உங்கள் வயலில் காணப்படும் அறிகுறிகள் என்ன?',
        suggestions: [
          { id: 'paddy_bottom_yellow', label: 'அடி இலைகள் மஞ்சள் நிறமாக மாறுதல் (ஊட்டச்சத்து)', category: 'symptom' },
          { id: 'paddy_brown_spots', label: 'கண் வடிவ பழுப்பு புள்ளிகள் (பிளாஸ்ட்)', category: 'symptom' },
          { id: 'paddy_stunted_wilting', label: 'குருத்து காய்ந்து போதல் (தண்டு துளைப்பான்)', category: 'symptom' },
          { id: 'paddy_custom', label: 'வேறு அறிகுறி — விவரிக்கிறேன்', category: 'custom' }
        ],
        offerExpert: true,
        expertReason: 'பாதிப்பு 20% மேல் இருந்தால் வேளாண் மருத்துவரிடம் ஆலோசனை பெறவும்.',
        detectedCrop: 'Paddy/Rice',
        detectedTopic: 'Disease'
      };
    }
    return {
      reply: `🌾 **Paddy Leaf Yellowing & Health Diagnosis:**
In paddy, leaf yellowing typically has two main causes:
1. **Nitrogen or Micronutrient Deficiency:** Starts on older bottom leaves, giving a pale green to yellow look. Treated with [[PRODUCT:${rootProd.id}:${rootProd.name}]].
2. **Paddy Blast (Pyricularia oryzae):** Yellowing accompanied by spindle-shaped brown lesions with gray centers. Treated with [[PRODUCT:${blastProd.id}:${blastProd.name}]] @ 150g/acre.

Field tip: Avoid excessive nitrogen fertilizer during cloudy weather to prevent fungal outbreaks.`,
      followUp: 'Which symptom best describes what you are seeing in your field?',
      suggestions: [
        { id: 'paddy_bottom_yellow', label: 'Older bottom leaves turning yellow (Nutrient)', category: 'symptom' },
        { id: 'paddy_brown_spots', label: 'Spindle-shaped brown spots on leaves (Blast)', category: 'symptom' },
        { id: 'paddy_stunted_wilting', label: 'Stunted tillers / Dead hearts (Stem Borer)', category: 'symptom' },
        { id: 'paddy_custom', label: 'Different symptom — let me describe', category: 'custom' }
      ],
      offerExpert: true,
      expertReason: 'If yellowing affects more than 20% of your crop, an Agronomy Expert can verify soil salinity and fungal infection.',
      detectedCrop: 'Paddy/Rice',
      detectedTopic: 'Disease'
    };
  }

  // 2. Cotton Whitefly / Bollworm
  if (text.includes('whitefly') || text.includes('cotton') || text.includes('பருத்தி') || text.includes('bollworm')) {
    const pestProd = findProd('whitefly') || findProd('flykill') || findProd('pest');
    if (cleanLang === 'ta') {
      return {
        reply: `🐛 **பருத்தி பூச்சி மேலாண்மை:**
பருத்தியில் வெள்ளை ஈ மற்றும் சாறு உறிஞ்சும் பூச்சிகள் இலைகளின் அடிப்பகுதியில் இருந்து சாற்றை உறிஞ்சி, தேன் போன்ற திரவத்தைச் சுரப்பதால் கரும்பூஞ்சை படரும்.
- **பரிந்துரைக்கப்படும் மருந்து:** [[PRODUCT:${pestProd.id}:${pestProd.name}]] @ 200–250 கிராம்/ஏக்கர் தெளிக்கவும்.
- **தெளிக்கும் முறை:** அதிகாலை அல்லது மாலையில் இலைகளின் அடிப்பகுதியில் நன்கு படும்படி தெளிக்கவும்.`,
        followUp: 'உங்கள் பருத்தி பயிரில் பூச்சி தாக்குதலின் தீவிரம் எவ்வாறு உள்ளது?',
        suggestions: [
          { id: 'cotton_early_nymphs', label: 'ஆரம்ப நிலை / சில வெள்ளை ஈக்கள் மட்டும்', category: 'symptom' },
          { id: 'cotton_black_mold', label: 'கரும்பூஞ்சை படிந்த தீவிர பாதிப்பு', category: 'symptom' },
          { id: 'cotton_leaf_curl', label: 'இலைகள் மேல்நோக்கி சுருண்டு வளர்ச்சி குன்றுதல்', category: 'symptom' },
          { id: 'cotton_custom', label: 'வேறு பூச்சி பிரச்சனை', category: 'custom' }
        ],
        offerExpert: true,
        expertReason: 'வெள்ளை ஈக்கள் இலைசுருள் வைரஸை வேகமாகப் பரப்பும்; சரியான பூச்சிக்கொல்லி சுழற்சிக்கு ஆலோசனை பெறவும்.',
        detectedCrop: 'Cotton',
        detectedTopic: 'Pest'
      };
    }
    return {
      reply: `🐛 **Cotton Pest Management:**
For whitefly and sucking pests in cotton, nymphs suck sap from leaf undersides, secreting honeydew that leads to black sooty mold and leaf curl virus.
- **Recommended Remedy:** Spray [[PRODUCT:${pestProd.id}:${pestProd.name}]] @ 200–250g per acre.
- **Application Tip:** Spray early morning or late afternoon, ensuring complete coverage on the undersides of the leaves.`,
      followUp: 'How severe is the infestation on your cotton plants?',
      suggestions: [
        { id: 'cotton_early_nymphs', label: 'Early stage / Few whiteflies spotted', category: 'symptom' },
        { id: 'cotton_black_mold', label: 'Heavy infestation with sticky black mold', category: 'symptom' },
        { id: 'cotton_leaf_curl', label: 'Leaves curling upwards with stunted growth', category: 'symptom' },
        { id: 'cotton_custom', label: 'Other pest issue', category: 'custom' }
      ],
      offerExpert: true,
      expertReason: 'Severe whitefly outbreaks spread leaf curl virus rapidly; consultation ensures right pesticide rotation.',
      detectedCrop: 'Cotton',
      detectedTopic: 'Pest'
    };
  }

  // 3. Soil Health & Testing
  if (text.includes('soil') || text.includes('மண்') || text.includes('ph') || text.includes('salinity') || text.includes('fertility')) {
    if (cleanLang === 'ta') {
      return {
        reply: `🌱 **மண் வளம் & ஊட்டச்சத்து மேலாண்மை:**
ஆரோக்கியமான மண்ணே அதிக மகசூலுக்கு அடித்தளம்:
- **சரியான pH அளவு:** 6.5 முதல் 7.5 வரை. அமில மண்ணிற்கு (<6.0) விவசாய சுண்ணாம்பு; கார மண்ணிற்கு (>8.0) ஜிப்சம் மற்றும் மக்கிய உரம் பரிந்துரைக்கப்படுகிறது.
- **கரிமக் கார்பன் (Organic Carbon):** வேர் வளர்ச்சிக்கு >0.75% இருப்பது சிறந்தது.
- உங்கள் ஆய்வக மண் பரிசோதனை முடிவுகளை எங்கள் கால்குலேட்டரில் உள்ளீடு செய்து உர பரிந்துரை பெறலாம்: [[PAGE:/soil-test-report:மண் பரிசோதனை அறிக்கை]].`,
        followUp: 'உங்கள் மண்ணில் தற்போது உள்ள சிக்கல் என்ன?',
        suggestions: [
          { id: 'soil_check_report', label: 'மண் பரிசோதனை அட்டை என்னிடம் உள்ளது', category: 'action' },
          { id: 'soil_alkaline_hard', label: 'இறுகிய மண் / உவர் நீர் பிரச்சனை', category: 'symptom' },
          { id: 'soil_organic_matter', label: 'மண் கரிம வளம் & நுண்ணுயிரிகளை அதிகரிக்க', category: 'symptom' },
          { id: 'soil_sampling_guide', label: 'மண் மாதிரி எடுக்கும் முறை', category: 'action' }
        ],
        offerExpert: false,
        expertReason: '',
        detectedCrop: profile?.crop || 'General Crops',
        detectedTopic: 'Soil'
      };
    }
    return {
      reply: `🌱 **Soil Health & Nutrient Management:**
Healthy soil is the foundation for high yields:
- **Optimal pH:** 6.5 to 7.5. Acidic soils (<6.0) require agricultural lime; alkaline soils (>8.0) benefit from gypsum and organic compost.
- **Organic Carbon:** Target >0.75% for optimal root nutrient uptake.
- You can enter your soil lab values into our online calculator for a personalized crop fertilizer dosage: [[PAGE:/soil-test-report:Check Soil Health Report]].`,
      followUp: 'What soil challenge are you addressing currently?',
      suggestions: [
        { id: 'soil_check_report', label: 'I have a soil test card to analyze', category: 'action' },
        { id: 'soil_alkaline_hard', label: 'Hard soil / Saline water issues', category: 'symptom' },
        { id: 'soil_organic_matter', label: 'Want to increase organic carbon and microbial health', category: 'symptom' },
        { id: 'soil_sampling_guide', label: 'How to collect proper soil samples', category: 'action' }
      ],
      offerExpert: false,
      expertReason: '',
      detectedCrop: profile?.crop || 'General Crops',
      detectedTopic: 'Soil'
    };
  }

  // 4. Inquired about Purchased Product
  if (recentPurchases.length > 0 && (text.includes('spray') || text.includes('dose') || text.includes('order') || text.includes('use') || text.includes('bought'))) {
    const lastItem = recentPurchases[0];
    return {
      reply: `📦 **Guidance for Your Purchased Product:**
Regarding your recent order of **${lastItem.productName}** (${lastItem.packSize}):
- **General Dilution:** 1.5g to 2g per liter of water (or 150–200g per 100 liters of water per acre) using a knapsack sprayer.
- **Timing:** Apply during clear weather, ideally before 9:00 AM or after 4:30 PM.
- **Safety:** Always wear protective gloves and face mask while handling agri-chemicals.`,
      followUp: 'What would you like guidance with for this product?',
      suggestions: [
        { id: 'prod_mixing', label: 'Can I tank-mix with a foliar fertilizer?', category: 'action' },
        { id: 'prod_timing', label: 'Safe waiting period before harvest', category: 'action' },
        { id: 'prod_issue', label: 'I noticed an issue after spraying', category: 'symptom' },
        { id: 'prod_different', label: 'Ask about another product or crop', category: 'custom' }
      ],
      offerExpert: false,
      expertReason: '',
      detectedCrop: profile?.crop || 'General Crops',
      detectedTopic: 'Product'
    };
  }

  // 4b. Severe Outbreak / Wilting / Phytotoxicity / Blight
  if (text.includes('wilt') || text.includes('blight') || text.includes('collapse') || text.includes('scorch') || text.includes('burn') || text.includes('phytotox') || text.includes('rot')) {
    const bioFung = findProd('pseudomonas') || findProd('trichoderma') || findProd('fungi') || relevantProducts[0] || { id: 'sb-01', name: 'Pseudomonas' };
    return {
      reply: `⚠️ **Severe Crop Health & Outbreak Alert:**
Sudden wilting, stem collapse, or post-spray chemical scorch require urgent diagnostic attention:
- **Emergency Action:** If caused by chemical overdose or spray scorch, flush foliage immediately with clean water and ensure root soil moisture.
- **Root Protection:** For bacterial wilt or fungal collar rot, drenching with antagonistic bio-agents like [[PRODUCT:${bioFung.id}:${bioFung.name}]] protects healthy root zones.
- **Specialist Diagnostic:** Widespread crop collapse requires field assessment: [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]].`,
      followUp: 'Has the wilting spread across more than 15-20% of your field?',
      suggestions: [
        { id: 'severe_sudden_collapse', label: 'Sudden collapse across multiple rows', category: 'symptom' },
        { id: 'severe_post_spray_burn', label: 'Leaf scorch noticed within 24h of spray', category: 'symptom' },
        { id: 'severe_book_consult', label: '👨‍⚕️ Schedule Agronomist Consultation', category: 'action' },
        { id: 'severe_check_soil', label: 'Check soil drainage & roots', category: 'action' }
      ],
      offerExpert: true,
      expertReason: 'Severe wilting or sudden collapse requires immediate root diagnostic to prevent complete crop loss.',
      detectedCrop: profile?.crop || 'Vegetables/Crops',
      detectedTopic: 'Disease'
    };
  }

  // 5. Agronomist / Doctor Consultation Request
  if (text.includes('agronomist') || text.includes('doctor') || text.includes('consult') || text.includes('call') || text.includes('expert') || text.includes('மருத்துவர்')) {
    return {
      reply: `👨‍⚕️ **Sathyam Agro Mart Agronomy Expert Consultations:**
Our certified agronomy specialists provide 1-on-1 consultations for field diagnostics, complex pest resistance, customized crop nutrition charts, and soil test interpretations.
- Free callbacks are scheduled with store-assigned specialists.
- You can choose your preferred date and time slot directly: [[PAGE:/agronomy-experts:Schedule Agronomist Consultation]].`,
      followUp: 'What topic would you like the agronomist to review?',
      suggestions: [
        { id: 'expert_pest_disease', label: 'Pest & Disease Outbreak Diagnosis', category: 'action' },
        { id: 'expert_fertilizer_yield', label: 'Fertilizer & Yield Booster Schedule', category: 'action' },
        { id: 'expert_soil_review', label: 'Soil Health & Salinity Management', category: 'action' },
        { id: 'expert_water_irrigation', label: 'Drip Fertigation & Water Quality', category: 'action' }
      ],
      offerExpert: true,
      expertReason: 'Book an expert consultation for scheduled 1-on-1 guidance.',
      detectedCrop: profile?.crop || 'General Crops',
      detectedTopic: 'General'
    };
  }

  // 6. Default Warm Greeting & Topic Starter
  const defaultProd = relevantProducts[0] || { id: 'sb-01', name: 'RootVigor Gold' };
  
  if (cleanLang === 'ta') {
    const userGreeting = profile?.name ? `வணக்கம் ${profile.name} அவர்களே!` : 'வணக்கம் விவசாயி! சத்யம் அக்ரோ மார்ட் AI பயிர் மருத்துவருக்கு வரவேற்கிறோம்.';
    let initialSuggestions = [
      { id: 'start_crop_pest', label: '🐛 பயிர் பூச்சி அல்லது நோய் கண்டறிதல்', category: 'action' },
      { id: 'start_fertilizer', label: '🌱 உரப் பரிந்துரை & ஊட்டச்சத்து மேலாண்மை', category: 'action' },
      { id: 'start_soil_test', label: '🧪 மண் பரிசோதனை வழிகாட்டி', category: 'action' },
      { id: 'start_expert', label: '👨‍⚕️ வேளாண் மருத்துவரிடம் ஆலோசனை பெற', category: 'action' }
    ];
    if (profile?.crop) {
      initialSuggestions = [
        { id: 'start_my_crop_pests', label: `🌾 ${profile.crop} பூச்சி & நோய் மருந்துகள்`, category: 'action' },
        { id: 'start_my_crop_fert', label: `🌱 ${profile.crop} உர அட்டவணை`, category: 'action' },
        { id: 'start_soil_test', label: '🧪 மண் பரிசோதனை அட்டை சரிபார்க்க', category: 'action' },
        { id: 'start_expert', label: '👨‍⚕️ வேளாண் மருத்துவரிடம் ஆலோசனை பெற', category: 'action' }
      ];
    }
    return {
      reply: `${userGreeting}
நான் உங்கள் 24/7 AI பயிர் மருத்துவர். பயிர் நோய்களைக் கண்டறிந்து, [[PRODUCT:${defaultProd.id}:${defaultProd.name}]] போன்ற மருந்துகளைப் பரிந்துரைக்கவும், உர அட்டவணை மற்றும் வேளாண் நிபுணர் ஆலோசனை பெறவும் உதவ முடியும்.`,
      followUp: 'இன்று உங்களுக்கு என்ன உதவி தேவை?',
      suggestions: initialSuggestions,
      offerExpert: false,
      expertReason: '',
      detectedCrop: profile?.crop || 'General Crops',
      detectedTopic: 'General'
    };
  }

  // Default English Greeting
  const userGreeting = profile?.name ? `Hello ${profile.name}!` : 'Hello Farmer! Welcome to Sathyam Agro Mart AI Farming Assistant.';

  let initialSuggestions = [
    { id: 'start_crop_pest', label: '🐛 Diagnose Crop Pest or Disease', category: 'action' },
    { id: 'start_fertilizer', label: '🌱 Fertilizer & Crop Nutrition Advice', category: 'action' },
    { id: 'start_soil_test', label: '🧪 Soil Health Analysis Guide', category: 'action' },
    { id: 'start_expert', label: '👨‍⚕️ Schedule Agronomist Consultation', category: 'action' }
  ];

  if (profile?.crop) {
    initialSuggestions = [
      { id: 'start_my_crop_pests', label: `🌾 ${profile.crop} Pest & Disease remedies`, category: 'action' },
      { id: 'start_my_crop_fert', label: `🌱 ${profile.crop} Fertilizer Schedule`, category: 'action' },
      { id: 'start_soil_test', label: '🧪 Check Soil Health Card', category: 'action' },
      { id: 'start_expert', label: '👨‍⚕️ Schedule Agronomist Consultation', category: 'action' }
    ];
  }

  return {
    reply: `${userGreeting}
I am your dedicated 24/7 Crop Doctor. I can help diagnose crop symptoms, recommend approved remedies like [[PRODUCT:${defaultProd.id}:${defaultProd.name}]], calculate fertilizer dosages, and link you with our senior agronomy experts.`,
    followUp: 'What would you like assistance with today?',
    suggestions: initialSuggestions,
    offerExpert: false,
    expertReason: '',
    detectedCrop: profile?.crop || 'General Crops',
    detectedTopic: 'General'
  };
}

/**
 * Calls Gemini REST API across candidate models with multi-turn support.
 */
export async function callGeminiAssistant({ apiKey, modelCandidates, systemPrompt, userMessage, history = [] }) {
  // Format past turns for Gemini contents array
  const contents = [];
  const recentTurns = (history || []).slice(-MAX_TURNS_CONTEXT);

  for (const turn of recentTurns) {
    const role = turn.sender === 'user' ? 'user' : 'model';
    const text = String(turn.text || turn.content || '').trim();
    if (text) {
      contents.push({ role, parts: [{ text }] });
    }
  }

  // Append current turn
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  for (const model of modelCandidates) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey
        },
        body: JSON.stringify({
          contents,
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            temperature: 0.2,
            maxOutputTokens: 800,
            responseMimeType: 'application/json'
          }
        })
      });

      if (res.ok) {
        const data = await res.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (rawText) {
          try {
            const parsed = JSON.parse(rawText);
            if (parsed && typeof parsed.reply === 'string') {
              return { success: true, result: parsed, model };
            }
          } catch {
            // If model returned text wrapped with markdown code fences
            const clean = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
            const parsed = JSON.parse(clean);
            if (parsed && typeof parsed.reply === 'string') {
              return { success: true, result: parsed, model };
            }
          }
        }
      }
    } catch (err) {
      // Try next model candidate
      continue;
    }
  }

  return { success: false };
}

/**
 * Main coordinator function processing an AI Assistant turn.
 */
export async function processAssistantTurn({
  message,
  sessionId,
  selectedOption,
  history = [],
  user,
  clientIp,
  db,
  apiKey,
  modelCandidates = [],
  lang = 'en'
}) {
  const query = String(message || '').trim();
  if (!query && !selectedOption) {
    return { success: false, status: 400, message: 'Message is required' };
  }

  const effectiveQuery = query || selectedOption?.label || '';
  const cleanLang = String(lang || 'en').trim().toLowerCase().slice(0, 5);

  // 1. Assemble context
  const context = await assembleFarmerContext({
    user,
    message: effectiveQuery,
    history,
    db
  });

  let responseData = null;
  let usedModel = 'rule-engine-fallback';

  // 2. Try Gemini API if key is present
  if (apiKey) {
    const systemPrompt = buildSystemPrompt({ ...context, lang: cleanLang });
    const apiResult = await callGeminiAssistant({
      apiKey,
      modelCandidates,
      systemPrompt,
      userMessage: effectiveQuery,
      history
    });

    if (apiResult.success) {
      responseData = apiResult.result;
      usedModel = apiResult.model;
    }
  }

  // 3. Graceful fallback if Gemini failed or was unconfigured
  if (!responseData) {
    responseData = generateDeterministicFallback({
      message: effectiveQuery,
      profile: context.profile,
      recentPurchases: context.recentPurchases,
      relevantProducts: context.relevantProducts,
      lang: cleanLang
    });
  }

  // Ensure suggestion consistency
  if (!Array.isArray(responseData.suggestions)) {
    responseData.suggestions = [];
  }

  // 4. Server-Side Persistence: Store session update in MongoDB
  try {
    if (typeof db.addChatRecord === 'function') {
      const turnCount = (Array.isArray(history) ? history.length : 0) + 2;
      const previewSnippet = `Q: ${effectiveQuery.slice(0, 45)}... A: ${responseData.reply.slice(0, 60)}...`;

      const turnHistory = [
        ...(Array.isArray(history) ? history.map(h => ({
          role: h.role || (h.sender === 'user' ? 'user' : 'assistant'),
          content: h.content || h.text || ''
        })) : []),
        { role: 'user', content: effectiveQuery },
        { role: 'assistant', content: responseData.reply }
      ];

      await db.addChatRecord({
        sessionId: sessionId || ('SES-' + Date.now().toString(36).toUpperCase()),
        userId: user?.id || null,
        user: user?.name || `Farmer (${String(clientIp || '127.0.0.1').slice(0, 8)})`,
        farmerPhone: user?.phone || '',
        crop: responseData.detectedCrop || context.profile?.crop || 'General Crops',
        topic: responseData.detectedTopic || 'Crop Advisory',
        date: new Date().toISOString().slice(0, 16).replace('T', ' '),
        messages: turnCount,
        turns: turnHistory,
        resolved: !responseData.followUp,
        preview: previewSnippet,
        updatedAt: new Date().toISOString()
      });
    }
  } catch {
    // Non-blocking persistence
  }

  return {
    success: true,
    sessionId: sessionId || ('SES-' + Date.now().toString(36).toUpperCase()),
    reply: responseData.reply,
    followUp: responseData.followUp || '',
    suggestions: responseData.suggestions || [],
    offerExpert: Boolean(responseData.offerExpert),
    expertReason: responseData.expertReason || '',
    detectedCrop: responseData.detectedCrop || 'General Crops',
    detectedTopic: responseData.detectedTopic || 'General',
    model: usedModel
  };
}
