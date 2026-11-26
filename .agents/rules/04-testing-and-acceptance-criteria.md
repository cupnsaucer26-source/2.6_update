# Testing & Acceptance Criteria
## Quality Assurance & Verification Standards

### 1. Mandatory Pre-Commit Verification Steps
Before any code is committed or marked as completed:
1. **Syntax & Static Verification**:
   - Backend: `node --check server/server.js` (and any modified `.js`/`.mjs` server files).
   - Frontend: `npm run build` (`vite build`) to verify bundle transformation, TypeScript/JSX syntax, and asset imports.
2. **API & Runtime Verification**:
   - For backend route changes: Test the route directly using a test script or curl/fetch to verify response codes, data payloads, and edge cases.
   - For database changes: Query MongoDB to confirm data persistence and schema compatibility.
3. **UI & Browser Verification**:
   - Inspect components using Chrome DevTools MCP or browser snapshots.
   - Test user interaction flows (form submission, modal close, validation errors).

### 2. Definition of Done (Acceptance Criteria)
A task is ONLY complete when:
- The requested feature/fix is implemented adhering to existing code conventions.
- Zero build errors (`npm run build` passes with code 0).
- Zero server crashes or unhandled promise rejections.
- Actual tests ran and passed (never assume code works without running it).
- Code is cleanly committed and pushed to the designated remote branch (`rensog/main`).
- Verified report is provided to the user detailing the exact actions taken and verified results.
