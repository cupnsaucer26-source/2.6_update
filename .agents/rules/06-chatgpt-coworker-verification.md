# ChatGPT Co-Worker Planning, Conflict Review & Evidence Standard
## Permanent Workspace Rule

1. **Co-Worker Review Gate:** For infrastructure migrations, Hostinger VPS setup/deployments, database changes, or complex multi-module plans, formulate a deep evidence-backed plan from the codebase first, share complete sanitized codebase context with ChatGPT (`https://chatgpt.com/`) in the built-in browser, and resolve all architectural or code conflicts collaboratively before executing.
2. **Evidence-Based Pushback & Consensus:** ChatGPT does not directly read the local repo. Cross-check every ChatGPT proposal against `server/server.js`, `server/db.js`, `server/http.js`, `package.json`, `server/package.json`, and live runtime facts. Explicitly call out conflicts and explain why until a conflict-free consensus is reached.
3. **Strict Secret Redaction:** Never share raw values from `server/.env` (secrets, keys, URIs with credentials, passwords) with external web pages or Git.
4. **100% Evidence Proof:** Validate all execution steps with concrete tool outputs (builds, checks, API health checks, and visual screenshots).
