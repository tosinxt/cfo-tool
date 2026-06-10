# Launch Checklist — Series A Pitch Tool

Run through every item below before going live. Check off each one only after you have observed the expected outcome with your own eyes.

---

## 1. Environment & Configuration

- [ ] All variables in `.env.example` are set in production environment
- [ ] `NEXT_PUBLIC_APP_URL` points to the production domain (not `localhost`)
- [ ] `STRIPE_WEBHOOK_SECRET` matches the secret shown in the Stripe webhook dashboard
- [ ] `SENTRY_DSN` / `NEXT_PUBLIC_SENTRY_DSN` is set and points to the correct Sentry project
- [ ] Firebase project is in production mode (not Spark / free tier if storage limits apply)
- [ ] Firestore Security Rules are deployed (`firestore.rules`)
- [ ] Firebase Storage rules are deployed and lock down `engagements/` to admin only
- [ ] `ADMIN_NOTIFICATION_EMAILS` contains the correct addresses
- [ ] `RESEND_FROM_ADDRESS` is a verified sending domain in Resend

---

## 2. Stripe Payment Flow (End-to-End)

- [ ] Open the landing page; click **Get Started →**
- [ ] Stripe Checkout loads with the correct product name and price
- [ ] Enter test card `4242 4242 4242 4242`, any future expiry, any CVC
- [ ] Payment succeeds; browser redirects to `/checkout/success?session_id=...`
- [ ] `/checkout/success` redirects to `/intake/<id>?token=<token>` within ~5 seconds
- [ ] Open the Stripe webhook dashboard — confirm a `checkout.session.completed` event was received with status **200**
- [ ] Open Firestore — confirm a new `engagements` document was created with `status: "awaiting_intake"`

---

## 3. Intake Form

- [ ] Intake URL (`/intake/<id>?token=<token>`) loads the multi-step form
- [ ] Completing Step 1 and refreshing the page restores the entered data (localStorage persistence)
- [ ] All 6 steps validate — submitting an empty required field shows a red error message
- [ ] Clicking **Back** on any step preserves the already-filled data
- [ ] Completing all steps and clicking **Submit** shows a spinner on the button
- [ ] After submit, browser navigates to `/intake/<id>/confirmed`
- [ ] Open Firestore — engagement `status` is now `"drafting"` and `intake` sub-object is populated
- [ ] Visiting the intake URL again after submission shows "Your intake has already been submitted"
- [ ] Visiting the intake URL with an **invalid token** returns the "This access token is invalid" gate screen

---

## 4. Email Notifications

- [ ] **Client confirmation email** arrives at the email address used at checkout (check spam)
  - Subject contains "confirmation" or similar
  - Body references the company / engagement
- [ ] **Admin notification email** arrives at each address in `ADMIN_NOTIFICATION_EMAILS`
  - Links or references the engagement ID
- [ ] Both emails render correctly on mobile (check via Gmail / Apple Mail preview)

---

## 5. AI Draft Generation

- [ ] After intake submission, wait ~60 seconds then reload the admin engagement page
- [ ] The amber **"AI generation in progress…"** banner is visible while `status === "drafting"`
- [ ] After generation completes, `status` transitions to `"ready_for_review"` in Firestore
- [ ] **Deck Draft** tab in admin shows the generated slide outline (title, bullets, notes)
- [ ] **Report Draft** tab shows the generated report sections
- [ ] Check Firestore — `aiDraft.deckOutline` and `aiDraft.reportSections` are populated
- [ ] If AI generation fails, `draftError` field appears in Firestore and a Sentry error is captured

---

## 6. File Generation (PPTX & PDF)

- [ ] After AI draft completes, Firebase Storage contains a `.pptx` file under `engagements/<id>/`
- [ ] Firebase Storage contains a `.pdf` file under `engagements/<id>/`
- [ ] **Files tab** → Download deck link is present and downloads a valid `.pptx`
- [ ] **Files tab** → Download report link is present and downloads a valid `.pdf`
- [ ] Open the `.pptx` in PowerPoint / Keynote — slides render without errors
- [ ] Open the `.pdf` in a viewer — sections render correctly

---

## 7. Admin Workflow

- [ ] Navigate to `/admin/login` — login form renders
- [ ] Enter incorrect credentials — "Access denied" error message appears (no raw Firebase error)
- [ ] Enter correct admin credentials — redirects to `/admin` dashboard
- [ ] Dashboard shows the test engagement in the queue
- [ ] On mobile (375px) the queue renders as **cards**, not a table
- [ ] Click **Review →** on the engagement — opens the engagement detail page
- [ ] **Intake tab**: edit a field, click **Save** — changes persist after page reload (check Firestore)
- [ ] **Intake tab**: click **Re-run AI draft** — `rerunning` spinner appears, request fires
- [ ] **Deck tab**: edit a slide title, click **Save** — `cfoEdits.deckOutline` updated in Firestore
- [ ] **Deck tab**: click **Regenerate .pptx** — new file appears in Firebase Storage
- [ ] **Report tab**: edit a section, click **Save** — `cfoEdits.reportSections` updated in Firestore
- [ ] **Files tab**: click **Approve** — `status` updates to `"approved"`, button shows "Approved ✓"
- [ ] **Files tab**: click **Email client** — opens the user's mail client with a pre-filled `mailto:`
- [ ] **Files tab**: click **Mark delivered** — `status` updates to `"delivered"`
- [ ] **Files tab**: upload a final `.pptx` file — file appears in Firebase Storage, deck download link updates
- [ ] Click **Audit log** — sidebar opens showing timestamped events for this engagement
- [ ] Click **Sign out** — redirects to `/admin/login`

---

## 8. Security

- [ ] Visit `/api/admin/engagement/<id>/intake` without a valid admin session cookie → `401` or redirect to login
- [ ] Visit `/api/admin/engagement/<id>/files` as a non-admin Firebase user → `401` or `403`
- [ ] Submit the intake form 6 times with the same IP in quick succession → 6th request returns `429 Too Many Requests`
- [ ] Tamper the `token` query parameter on the intake URL → `403 Invalid token`
- [ ] Access Firestore directly with a non-admin user account → permission denied (Security Rules enforce this)
- [ ] Confirm Stripe webhook signature validation: replay the webhook event from Stripe dashboard → `200` received; forge the signature manually → `400` returned

---

## 9. Static & Legal Pages

- [ ] `/privacy` loads the Privacy Policy page without errors
- [ ] `/terms` loads the Terms of Service page without errors
- [ ] Landing page footer has working links to both `/privacy` and `/terms`
- [ ] Privacy Policy references all correct sub-processors (Firebase, Stripe, Anthropic, Resend, Sentry)
- [ ] Terms of Service references the correct company name and governing law jurisdiction

---

## 10. Lighthouse / Performance

- [ ] Run Lighthouse on the landing page (`/`) in Chrome DevTools
  - Performance score ≥ 80
  - Accessibility score ≥ 90
  - Best Practices score ≥ 90
  - SEO score ≥ 90
- [ ] `<title>` and `<meta name="description">` are present on every public page
- [ ] Intake form: every input has a visible `<label>` associated via `htmlFor`/`id`
- [ ] No console errors on any page in production mode

---

## 11. Sentry

- [ ] Trigger a test error (e.g., temporarily throw in a route handler) and confirm it appears in the Sentry dashboard
- [ ] Sentry is **not** capturing errors in local development (unless `SENTRY_DEBUG=1`)
- [ ] Source maps are uploaded during production build (Sentry shows line-level stack traces)

---

## 12. Final Checks

- [ ] `npm run build` completes without TypeScript errors or warnings
- [ ] No `console.log` debug statements left in production code
- [ ] `.env.local` is in `.gitignore` and not committed to the repo
- [ ] Firebase service account JSON is not committed to the repo
- [ ] Stripe secret key is not committed to the repo
- [ ] All promotional copy on the landing page is final and accurate
- [ ] DNS / domain is pointing to the production deployment
- [ ] HTTPS is enforced (no mixed-content warnings)
