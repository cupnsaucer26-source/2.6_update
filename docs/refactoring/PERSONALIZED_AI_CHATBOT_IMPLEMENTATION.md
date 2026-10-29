# SATHYAM AGRO MART — PERSONALIZED AI FARMING ASSISTANT
## Architecture, Implementation & Verification Report

**Document ID:** `PERSONALIZED_AI_CHATBOT_IMPLEMENTATION`  
**Date:** October 29, 2026  
**Status:** Successfully Implemented & Verified (Zero Commits, Zero Pushes)  
**Target Repository:** `C:\Users\step1\OneDrive\Desktop\2.6-test_cases\2.6_update`  

---

## 1. Existing Implementation Discovered

Before writing code, Phase 1 code inspection established the baseline state:

1. **`src/storefront/sections/Chatbot.jsx`:**
   - Contained a floating drawer widget calling `POST /api/chat/assistant` with `{ message: text }`.
   - Handled text formatting with `formatAiText` parsing `[[PRODUCT:...]]`, `[[PAGE:...]]`, `[[WHATSAPP:...]]`.
   - Maintained messages only in transient component memory (`useState([])`); refreshing the page completely erased conversation history.
   - Displayed 4 static quick chat chips (`QUICK_CHATS`) that never adapted to user profile or context.
   - Lacked structured suggestions, follow-up callouts, and expert booking triage.

2. **`POST /api/chat/assistant` in `server/server.js:4223`:**
   - Accepted `{ message, sessionId }`. Ignored multi-turn history (`history` array was omitted from prompt).
   - Injected the top 50 products indiscriminately without relevance filtering.
   - Did not inspect user profile or past orders.
   - Called Gemini model candidates using single-turn `contents: [{ role: 'user', parts: [{ text: query }] }]`.
   - Returned `{ success: true, reply, model }` as plain text without structured suggestions.

3. **`src/pages/shared/ChatRecords.jsx`:**
   - Displayed a hardcoded static constant `const RECORDS = [...]` with 3 fake rows (`SES-001`, `SES-002`, `SES-003`).
   - Never called `GET /api/chat/records`. Lacked search filtering, loading state, error handling, and CSV export.

4. **`server/db.js` (`ChatRecord` model):**
   - Had `db.getChatRecords()` and `db.addChatRecord()`.
   - Calling `addChatRecord` repeatedly for the same session threw a duplicate key error because it only used `create()` rather than upserting/updating existing documents.

5. **`src/pages/AgronomyExperts.jsx` & `POST /api/agronomy-bookings`:**
   - Fully implemented human consultation appointment engine with double-booking rejection and store isolation.
   - Did not accept context parameters from the chatbot.

---

## 2. Final Architecture and Conversation Flow

```mermaid
flowchart TD
    subgraph Farmer Interaction
        FARMER[Farmer opens Chatbot]
        INIT[Personalized Welcome & Crop Chips]
        FARMER --> INIT
        INPUT[Farmer Types Question OR Selects Dynamic Suggestion]
        INIT --> INPUT
    end

    subgraph Context Assembly Layer
        API[POST /api/chat/assistant]
        INPUT --> API
        AUTH{Authenticated?}
        API --> AUTH
        AUTH -->|Yes| PROF[Farmer Profile: Name, Crop, Acreage, District]
        AUTH -->|Yes| ORD[Recent Purchases from db.getOrdersForCustomer]
        AUTH -->|No / Guest| GUEST[Guest Session: IP Rate Limit, No Personal Data]
        CAT[Authoritative Live Catalog Filtered by Crop/Pest Relevance]
        HIST[Last 4-6 Conversation Turns]
        PROF --> PROMPT[Context-Aware System Instruction]
        ORD --> PROMPT
        CAT --> PROMPT
        HIST --> PROMPT
        GUEST --> PROMPT
    end

    subgraph AI Engine & Fallback
        GEMINI{Gemini API Configured & Reachable?}
        PROMPT --> GEMINI
        GEMINI -->|Yes| GEN[Multi-turn JSON Generation: 0.2 Temp]
        GEMINI -->|No / Timeout| DET[Deterministic Agronomy Rule Engine]
        GEN --> RESP[Structured Response: Reply + Follow-Up + Suggestions + Expert Flag]
        DET --> RESP
    end

    subgraph Persistence & Frontend Actions
        DB[(MongoDB ChatRecord Upsert)]
        RESP --> DB
        CLIENT[Frontend Message Bubble + Interactive Tags]
        RESP --> CLIENT
        SUGG[Dynamic Suggestion Chips]
        CLIENT --> SUGG
        SUGG -.->|1-Click Answer| INPUT
        EXPERT[Optional: Book an Agronomy Expert]
        CLIENT --> EXPERT
        EXPERT -->|Voluntary Click| BOOKING[/agronomy-experts with Pre-Filled Crop & Issue]
    end
```

---

## 3. Context Sources Actually Integrated

1. **Active Conversation Turns:**
   - Client sends up to 6 recent turns (`[{ sender: 'user'|'bot', text }]`).
   - Server preserves past questions and answers so the AI assistant never asks for already-supplied information.

2. **Farmer Profile Context (`user`):**
   - Only retrieved on the backend via verified JWT token (`getAuthenticatedUser(req)`).
   - Ingests `name`, registered `crop`, `crops`, `acreage`, `district`, `state`.
   - Used to personalize greetings and prioritize recommendations for the farmer's registered crop.

3. **Authorized Order History & Purchased Products:**
   - Verified via `db.getOrdersForCustomer(user)`.
   - Extracts product names, pack sizes, purchase dates, and delivery statuses from the latest 5 orders.
   - Injected only when the farmer inquires about product usage, dosage, or order status.

4. **Authoritative Live Catalog Grounding:**
   - Queries active online products from `db.getProducts({ onlineOnly: true })`.
   - Performs deterministic term-frequency scoring matching crops, target pests, and active ingredients.
   - Injects the top 15 most relevant products with exact prices, approved dosages, and action tags `[[PRODUCT:id:Name]]`.

---

## 4. Context Sources Unavailable or Intentionally Excluded

1. **Unregistered Personal Details:**
   - Phone numbers, passwords, payment card details, and unrelated personal fields are strictly excluded from AI prompts.
2. **Other Customers' Data:**
   - Strictly enforced boundary: a farmer's session cannot access another customer's orders or conversation records.
3. **Hidden Tracking / Surveillance:**
   - No tracking cookies, browser fingerprinting, or undisclosed monitoring was introduced.
4. **Manual Live-Agent Escalation Queue:**
   - Intentionally omitted in accordance with the product decision (strictly AI-first).

---

## 5. Dynamic Suggestion Strategy

Suggestions are generated dynamically based on the current user question and conversation turns:

- **Example 1 — Paddy Yellow Leaves:**
  - *Follow-up:* *"Which symptom best describes what you are seeing in your field?"*
  - *Chips:*
    1. `Older bottom leaves turning yellow (Nutrient)`
    2. `Spindle-shaped brown spots on leaves (Blast)`
    3. `Stunted tillers / Dead hearts (Stem Borer)`
    4. `Different symptom — let me describe`
- **Example 2 — Cotton Whitefly / Bollworm:**
  - *Follow-up:* *"How severe is the infestation on your cotton plants?"*
  - *Chips:*
    1. `Early stage / Few whiteflies spotted`
    2. `Heavy infestation with sticky black mold`
    3. `Leaves curling upwards with stunted growth`
    4. `Other pest issue`
- **Example 3 — Purchased Product Inquiry:**
  - *Follow-up:* *"What would you like guidance with for this product?"*
  - *Chips:*
    1. `Can I tank-mix with a foliar fertilizer?`
    2. `Safe waiting period before harvest`
    3. `I noticed an issue after spraying`
    4. `Ask about another product or crop`
- **Example 4 — General Greeting / Topic Starter:**
  - If farmer has registered crop (e.g. Sugarcane):
    1. `🌾 Sugarcane Pest & Disease remedies`
    2. `🌱 Sugarcane Fertilizer & Growth Schedule`
    3. `🧪 Check Soil Health Card`
    4. `👨‍⚕️ Book Agronomy Doctor Consultation`
  - If guest: broad agricultural categories (Paddy, Cotton, Soil Test, Agronomist).

---

## 6. Profile, Crop, Product, and Purchase-Data Handling

- **Authoritative Integrity:**
  - Product prices and stock are derived exclusively on the server from the live catalog. Client-submitted prices or item totals are ignored.
- **Privacy Enforcement:**
  - User profile data is fetched from the database session claims (`sub`), never trusted from client request bodies.
- **Graceful Null Handling:**
  - Missing profile fields (e.g. unselected crop or guest session) fall back gracefully to general farming guidance without crashing.

---

## 7. Agronomy Safety and Uncertainty Handling

- **Honest Diagnostics:**
  - AI prompt and fallback rules explicitly instruct the assistant to present diagnoses as *possibilities* rather than absolute certainty.
- **No Hallucinated Chemicals:**
  - Prohibits recommending off-label mixtures, banned agro-chemicals, or products not stocked in the verified catalog.
- **Field Safety Disclaimers:**
  - Always includes practical safety precautions (wearing gloves/masks, spraying during early morning/evening, avoiding rain/cloudy spraying).
- **Expert Triage for Severe Issues:**
  - Automatically flags `offerExpert: true` when yellowing or infestation is severe, widespread, or ambiguous.

---

## 8. Expert Booking Integration

- **Seamless Workflow:**
  - When `offerExpert: true` or when the user requests a doctor, a dedicated secondary action card appears:
    `[ 👨‍⚕️ Book an Agronomy Expert ]`
  - Clicking it navigates to `/agronomy-experts` with router state:
    ```json
    {
      "fromChat": true,
      "topic": "Pest & Disease Outbreak",
      "crop": "Paddy/Rice",
      "notes": "Referral from AI Crop Assistant session SES-XXXX. Discussed disease on Paddy/Rice."
    }
    ```
  - In `src/pages/AgronomyExperts.jsx`, a referral banner is shown:
    *"Crop Assistant Referral: Reviewing guidance for Paddy/Rice. Select an available expert below to schedule your consultation."*
  - Pre-populates the booking modal fields (`crop`, `topic`, `notes`) so the farmer does not have to re-enter them.
- **Voluntary & Safe:**
  - Does NOT auto-submit or select an expert/slot without user consent.
  - The farmer can ignore the button and continue chatting freely.

---

## 9. Chat History and Admin Record Behaviour

1. **Client Session Persistence:**
   - Active session ID stored in `localStorage` (`sathyam_chat_session_id`).
   - Conversation messages stored in `localStorage` (`sathyam_chat_history_v2_${sessionId}`).
   - Page refresh restores the active dialogue so ongoing crop consultations are not lost.
   - Header includes a "New" conversation button (`fa-rotate-right`) to cleanly clear state and start fresh.
2. **Server-Side Session Storage (`server/db.js`):**
   - Each turn upserts the session into MongoDB `ChatRecord`.
   - Records `sessionId`, `userId`, `user`, `farmerPhone`, `crop`, `topic`, `messages` count, `preview`, `updatedAt`.
3. **Live Admin Chat Records Page (`src/pages/shared/ChatRecords.jsx`):**
   - Replaced static mock array with live `axios.get('/api/chat/records')`.
   - Includes real-time search filter across session IDs, farmer names, crops, and message previews.
   - Includes real "Export CSV" feature downloading a `.csv` file.
   - Handled loading spinner, error state with "Retry" button, and empty state.
   - Role-protected: accessible only to `admin`, `employee`, and `superadmin`.

---

## 10. Files Changed and Why

| File Path | Nature of Change | Reason |
|---|---|---|
| `server/chatAssistant.js` | **New file** | Context assembly layer, catalog grounding, Gemini multi-turn execution, and deterministic fallback engine. |
| `server/server.js` | **Modified** | Imported `processAssistantTurn`, integrated multi-turn `/api/chat/assistant`, added `/api/chat/history`, enhanced `/api/chat/records` with store scoping. |
| `server/db.js` | **Modified** | Enhanced `addChatRecord` to upsert records avoiding duplicate key errors on multi-turn chats; added `getChatRecordBySessionId`. |
| `src/storefront/sections/Chatbot.jsx` | **Modified** | Local storage conversation persistence, user profile crop greeting, dynamic suggestion chips, follow-up callouts, and expert booking action. |
| `src/storefront/storefront.css` | **Modified** | Styled `.chat-followup-box`, `.chat-suggestion-chip`, `.chat-expert-card`, `.chat-expert-btn`, and header reset button. |
| `src/pages/shared/ChatRecords.jsx` | **Modified** | Replaced static fake data with live `/api/chat/records` endpoint, search filter, and CSV download. |
| `src/pages/AgronomyExperts.jsx` | **Modified** | Consumes router `location.state` to display chatbot referral banner and pre-populate consultation fields. |
| `server/tests/chat-assistant.test.mjs` | **New file** | 14 integration tests verifying context assembly, privacy, dynamic suggestions, persistence, and authorization. |
| `src/shared/__tests__/chatbot.test.js` | **New file** | 5 unit tests verifying tag extraction, profile starter logic, and expert referral payload format. |

---

## 11. API Contract Changes

### `POST /api/chat/assistant`
- **Request Body (Enhanced, backward compatible):**
  ```json
  {
    "message": "My leaves have yellow spots",
    "sessionId": "SES-10A2B3C4",
    "selectedOption": { "id": "symptom_1", "label": "Yellow spots" },
    "history": [
      { "sender": "user", "text": "Hello" },
      { "sender": "bot", "text": "Welcome to Crop Assistant" }
    ]
  }
  ```
- **Response Body (Enhanced):**
  ```json
  {
    "success": true,
    "sessionId": "SES-10A2B3C4",
    "reply": "Diagnosing your paddy leaves...",
    "followUp": "Which symptom best describes what you are seeing?",
    "suggestions": [
      { "id": "symptom_1", "label": "Older bottom leaves turning yellow", "category": "symptom" }
    ],
    "offerExpert": true,
    "expertReason": "Fungal infections require verification.",
    "detectedCrop": "Paddy/Rice",
    "detectedTopic": "Disease",
    "model": "gemini-3.5-flash"
  }
  ```

### `GET /api/chat/records`
- **Authorization:** `requireAuth('admin', 'employee')`.
- **Response Body:** `{ success: true, data: [ ...real chat record objects ] }`.

### `GET /api/chat/history`
- **Authorization:** Open to session owner; non-staff users strictly prevented from accessing other users' records.
- **Response Body:** `{ success: true, sessionId, record }`.

---

## 12. Tests Executed and Exact Results

### 1. Dedicated AI Assistant Test Suites
- **`server/tests/chat-assistant.test.mjs`:** **14 / 14 passing (100%)**
  - Context assembly with profile and orders.
  - Guest isolation and privacy boundaries.
  - System prompt grounding and anti-hallucination rules.
  - Deterministic fallbacks for Paddy, Cotton, and Orders.
  - Multi-turn session persistence without duplicate key error.
  - Admin authorization and store boundary enforcement on `/api/chat/records`.
  - Ownership boundaries on `/api/chat/history`.
  - Empty message validation refusal (HTTP 400).
- **`src/shared/__tests__/chatbot.test.js`:** **5 / 5 passing (100%)**
  - Tag extraction (`[[PRODUCT:...]]`, `[[PAGE:...]]`, `[[WHATSAPP:...]]`).
  - Personalized welcome and suggestion chips for registered Sugarcane farmer.
  - Default agricultural starter categories for guests.
  - Safe expert booking referral payload builder.
  - Multi-turn history formatting.

### 2. Regression & Parity Verification
- **`src/shared/__tests__/faSubset.test.js`:** **3 / 3 passing (100%)**
- **All frontend unit tests (`src/shared/__tests__/*.test.js`):** **218 / 218 passing (100%)**
- **Core server test suites (`agronomy-booking`, `support-tickets`, `financial-parity`, `chat-assistant`):** **42 / 42 passing (100%)**

---

## 13. Browser and Integration Verification Actually Performed

1. **Isolated Vite Build Verification:**
   - Command: `npx vite build --outDir ../test_temp_dist`
   - Result: `✓ 1817 modules transformed. ✓ built in 40.33s` with zero errors.
   - Cleaned temporary directory immediately after build; tracked `dist/` was not overwritten.
2. **Backend Syntax Verification:**
   - `node --check server/server.js`: **Passed (Exit 0)**
   - `node --check server/db.js`: **Passed (Exit 0)**
   - `node --check server/chatAssistant.js`: **Passed (Exit 0)**

---

## 14. Security and Privacy Checks

- **Zero Credentials in Client Bundles:** `GEMINI_API_KEY` is referenced solely in `server/server.js` and `server/chatAssistant.js`.
- **Token Security:** Authenticated user claims are verified on the server using HMAC-SHA256 tokens with password fingerprint matching.
- **Cross-Customer Data Isolation:** Farmers cannot view or query other customers' orders or chat histories.
- **Rate Limiting:** IP rate limiting (30 requests/minute) protects against Denial of Service and API quota exhaustion.
- **Input Sanitization:** User messages are sanitized and size-bounded before insertion into prompts or database records.

---

## 15. Remaining Limitations and Future Recommendations

1. **Live Gemini API Quota in Production:**
   - In production, ensure `GEMINI_API_KEY` has active Gemini Flash quota configured in Hostinger environment variables. The system will automatically utilize the AI model with instant fallback to the deterministic rule engine if rate limits are reached.
2. **Offline Handset Sync:**
   - Currently, chat messages persist in client `localStorage` and server MongoDB. If a farmer switches mobile devices without logging in, the guest session remains local to that browser. Authenticated farmers retain server records.

---

## 16. Final Git Status

- **Branch:** `main` tracking `rensog/main` at HEAD `737bf8c125a3a85a018c074c56c926e3ef89df2f`
- **Commits:** **0 commits made.**
- **Pushes:** **0 pushes made.**
- **Staged Changes:** **0 files staged.**
- **Tracked Modified Files:** Preserved intact across Batches 1–29.
- **Batch 30 Status:** **NOT STARTED.** Admin Order Fulfillment controls remain untouched. Leave Management remains strictly **DEFERRED pending formal client confirmation**.
