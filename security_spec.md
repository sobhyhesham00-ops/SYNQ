# Firestore Security Specification

This security specification details the Data Invariants, adversarial "Dirty Dozen" validation test payloads, and test runner requirements designed to verify that the system securely enforces attribute-based and role-based access controls.

## 1. Data Invariants
1. **User Identity Isolation**: No authenticated or anonymous user can create, update, or read another user's private data or change their own user `role` (e.g. escalating from `agent` to `tl` or `qa`).
2. **Access Control Hierarchy**: Normal `agents` can read collections and create their own records (e.g., in `inquiries`, `todos`, `timelogs`, `scheduling_requests`). They can edit/update only their own records unless a collaborative field allows transition.
3. **Admin/TL Supremacy**: Users with verified Team Leader roles (`tl`) or Quality Assurance (`qa`) have write access to administrative status overrides, schedules, QA scores, and system config.
4. **Strict Boundaries & Schema**: Documents cannot contain arbitrary schema fields, and all text strings have sizes strictly limit-validated. All timestamps must strictly align with `request.time`.

---

## 2. The "Dirty Dozen" Adversarial Payloads
Our security rules explicitly block the following twelve malformed or unauthorized write operations:

1. **Self-Escalation**: An agent attempt to write/update their own profile setting `role = "tl"`.
2. **Identity Spoofing (Create)**: Creating a `todo` with a different investigator's `agentName` or user ID to frame someone else.
3. **Identity Spoofing (Update)**: Modifying a `scheduling_request` belonging to another agent to alter scheduled shifts of another agent.
4. **Immutable Field Tampering**: Modifying the `createdAt` value of any request after creation.
5. **System Parameter Overwriting**: Any client direct request trying to overwrite the centralized `system/sched_qa_template` document.
6. **Denial of Wallet (ID Poisoning)**: Creating a record with an ID consisting of 1.5 KB of junk characters to waste memory/indexing.
7. **Value Poisoning (Out of range stats)**: Updating a QA evaluation score to 9999 or negative value.
8. **Orphaned Write**: Submitting a request referencing a non-existent agent profile.
9. **Status Shortcutting**: Directly transitioning a shift swap status from `pending` to `approved` without TL approval fields.
10. **State Corruption (Float Injection)**: Injecting floating/nan values to numeric count/duration fields in `timelogs`.
11. **Malicious Content Spraying**: Submitting an inquiry with text over 100K characters or links list over safe limit blocks.
12. **PII Exfiltration**: Attempting a root-level blanket read/get query on private profiles or credentials of other users.

---

## 3. Test Runner
We enforce these laws using a comprehensive suite in `firestore.rules.test.ts` (or standard simulation tests) ensuring every "Dirty Dozen" payload is blocked by returning `PERMISSION_DENIED`. Every rule draft must undergo verification until all tests pass.
