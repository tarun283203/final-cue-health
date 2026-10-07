# Cuehealth photo reviews — setup and maintenance

## Status

Verified directly against the store on 2026-10-07: shop name Cuehealth, domain cuehealth.in, Basic plan, currency INR, country India, theme Dawn ("final-cue-health/main", live/MAIN). Pushing to this repo's `main` branch on GitHub auto-deploys straight to that live theme — there is no separate "duplicate theme and paste code" step for this store, and §4 below has been corrected to match.

The `cuehealth_review` metaobject definition and the `custom.cuehealth_reviews` product metafield definition (§1) have been **created directly via the Shopify Admin API**, with the exact fields and keys this section expects. `sections/cuehealth-reviews.liquid`, `assets/cuehealth-reviews.css/js` and the `product.json` wiring are committed and already live on the storefront.

Not yet done, because no real customer data has been supplied: no review entries exist, no customer photos have been uploaded, and no product has any reviews linked. Nothing here publishes a review until real feedback and images are provided.

Separately, `sections/customer-testimonials.liquid` (homepage) has been fixed: its five fabricated testimonials and hardcoded "4.9/5 average" were removed from `templates/index.json`, and the section code no longer computes an average unless real blocks exist. A Judge.me app is also installed and its block is on the product template, but it is currently configured with `review_data: "sample_data"`, which shows Judge.me's demo reviews, not real ones — still needs to be switched over once Judge.me has real reviews or dropped in favor of this system.

## 0. On-site submission API (POST + GET)

Added 2026-10-07: `google-apps-script/review-api.gs` is a self-hosted API (deployed on Google Apps Script, not a Shopify app) that lets a site visitor write a review directly on the product page, instead of only through WhatsApp or admin entry.

- **POST** (submission): the "Write a review" form on each product page sends name, rating, review text, optional city, and an optional photo (resized to max 1000px client-side and base64-encoded) to the deployed `/exec` URL. The script uploads the photo to Shopify Files, creates a **Draft** `cuehealth_review` metaobject, and appends it to that product's `custom.cuehealth_reviews` metafield. Nothing becomes visible until you set the entry Active in Shopify Admin.
- **GET** (listing): `?productId=<id>` returns the product's **Active** reviews as JSON (or JSONP with `&callback=`). The storefront itself doesn't need this — the Liquid section already server-renders Active reviews at page load — but it's there for verification, testing, or future use outside this theme.

Setup (one-time, by you — this requires revealing a Shopify Admin API access token, which only you can generate):
1. Shopify Admin → Settings → Apps and sales channels → Develop apps → Create an app → Configure Admin API scopes. Enable: `read_products`, `write_products`, `read_metaobjects`, `write_metaobjects`, `read_files`, `write_files`. Install the app, then reveal the Admin API access token.
2. In a new Google Sheet → Extensions → Apps Script, paste the contents of `google-apps-script/review-api.gs` as `Code.gs`.
3. In that Apps Script project: Project Settings → Script properties → add `SHOPIFY_STORE` (e.g. `cuehealth.in`) and `SHOPIFY_ADMIN_TOKEN` (the token from step 1). Never put the token in this repo or in any client-side code.
4. Deploy → New deployment → Web app. Execute as "Me", access "Anyone". Copy the `/exec` URL.
5. Shopify Admin → Online Store → Themes → Customize → open a product page → Cuehealth Reviews section → paste that URL into **"Review submission URL"**. The "Write a review" button stays hidden on every product until this is set.

Until step 5 is done, the section behaves exactly as before (empty-state card with the WhatsApp link, no "Write a review" button).

## Architecture

Customer feedback → merchant-owned `cuehealth_review` metaobject → Shopify image file reference → product metafield `custom.cuehealth_reviews` (ordered list of metaobject references) → `cuehealth-reviews` Liquid section. The new §0 API is an additional, optional front door into the same metaobject, alongside manual admin entry.

A product list avoids scanning all reviews in the store. Product references inside the entries provide an additional filter. Featured photos lead the gallery; review cards retain the product list order. Rating averages include only ratings present and in the 1–5 range. Unrated reviews count toward the review count but not the rating denominator. There is no invented average, customer count or verification label. A visible statement explains that Cuehealth publishes the feedback on customers’ behalf.

Official references:
- https://shopify.dev/docs/apps/build/metaobjects
- https://shopify.dev/docs/apps/build/metafields/list-of-data-types
- https://shopify.dev/docs/apps/build/metafields/metafield-limits
- https://shopify.dev/docs/api/liquid/tags/paginate

## 1. Data definition — done

Created via API on 2026-10-07:
- Metaobject definition `cuehealth_review`: `gid://shopify/MetaobjectDefinition/25435406435`, display name field `reviewer_name`, storefront access `PUBLIC_READ`.
- Product metafield definition `custom.cuehealth_reviews`: `gid://shopify/MetafieldDefinition/298886922339`, type `list.metaobject_reference` restricted to `cuehealth_review`, pinned, storefront access `PUBLIC_READ`.

The publishable capability is enabled on the definition, so every entry has a Draft/Active status in Shopify Admin. New entries default to Draft and are excluded from the storefront automatically until switched to Active — create entries as Draft, check the claim against the original feedback, then activate. The field table below is for reference when editing entries in Shopify Admin → Content → Metaobjects → Cuehealth Review:

| Display label | Key | Shopify type | Required / validation |
| --- | --- | --- | --- |
| Customer name | reviewer_name | Single line text | Required |
| Rating | rating | Integer | Optional; minimum 1, maximum 5 |
| Review text | review_text | Multi-line text | Required |
| Customer image | customer_image | File reference | Optional; accept images only |
| Product | product_reference | Product reference | Required; one product |
| Review date | review_date | Date | Optional; actual feedback date only |
| Location | location | Single line text | Optional; actual appropriate location only |
| Featured | featured | True or false | Optional |
| Verification status | verification_status | Single line text | Optional; choices below |
| Image alt text | image_alt_text | Single line text | Optional |

Verification choices: `unverified`, `verified_customer`, `verified_purchase`. Leaving the field blank or choosing unverified produces no badge. Only use a verified value with supporting evidence. Do not infer a purchase from possession of a photo.

Next: Settings → Custom data → Products → Add definition:
- Name: **Cuehealth reviews**
- Namespace and key: **custom.cuehealth_reviews**
- Type: **Metaobject reference**, choose **List of entries**
- Restrict references to **Cuehealth Review**
- Enable storefront access if offered, and pin the definition for convenient editing.

This is a review-related product metafield only. No changes to prices, inventory, checkout, orders or customer records are needed.

## 2. Upload photos before creating entries

Once real, permission-cleared customer photos are supplied, uploads can be done directly via the Shopify Admin API (`stagedUploadsCreate` + `fileCreate`) — no manual Files-page step needed. Prefer properly oriented square JPEG/WebP images around 1000–1200 pixels, without private WhatsApp interface details. Shopify hosts the resulting images under a permanent CDN URL; the section resolves that via `image_url`, so no local or temporary paths are ever embedded in the review record.

Manual alternative: Shopify Admin → Content → Files → Upload files, then select the uploaded file in each entry's Customer image field.

## 3. Create and link genuine reviews

Entries can be created directly via the `metaobjectCreate` mutation once real feedback is supplied, using the fields above, with status Draft by default. Manual alternative: Content → Metaobjects → Cuehealth Review → Add entry.

Fill the fields from real supplied feedback only. Leave rating empty if it was not supplied or clearly supported. Map each image to the correct customer and product. Flag potentially problematic health claims before setting the entry Active; don't silently replace customer meaning with a different claim. Use consented public names and locations.

Open Products → the relevant product → Metafields → Cuehealth reviews → Select entries (or set the product metafield via `metafieldsSet`). Add that product's Active reviews and arrange the order. Save. An entry whose Product field does not match this product will be excluded even if accidentally selected. Empty names/text and Draft entries also do not display. Products without reviews show a truthful empty state.

Use the actual number supplied; do not fill a target of 50 with fabricated entries. `cuehealth-review-intake.csv` is an empty intake template with headers only, not a Shopify import file. Store original feedback, evidence and claim flags privately; publish only approved public fields.

## 4. Theme files — done, deployed automatically

This store's GitHub repo is connected to Shopify so that every push to `main` deploys straight to the live theme ("final-cue-health/main"). There is no duplicate-theme step for this store: `sections/cuehealth-reviews.liquid`, `assets/cuehealth-reviews.css`, `assets/cuehealth-reviews.js` and the `cuehealth_reviews` section entry in `templates/product.json` are already committed and confirmed present on the live theme.

The default `product.json` controls every product using the default product template, which is all three current products (Periods Care, Shilajit, EverYoung). A product only needs its own metafield populated (§3) to show reviews — no further theme edit is needed per product. If a future product uses a different template, add the section there with **Theme editor → that template → Add section → Cuehealth Reviews**, placed beneath product details.

## Maintenance

- Edit: Content → Metaobjects → Cuehealth Review → entry → change approved fields → Save. The linked product automatically reflects the update.
- Add: upload photo first, create the entry, then append it to that product's Cuehealth reviews list.
- Feature: set Featured true to move the photo toward the gallery's beginning. Multiple featured photos are shown in reverse list order; reorder the product list for the desired card order.
- Remove from a product: remove the entry from its product metafield list and save.
- Withdraw globally: set the entry Draft. For deletion, remove its references first and then delete it from Content → Metaobjects. Remove an image from Files only after checking that nothing else uses it.
- New product: create entries with that product reference and link them to the new product. The same section works for Periods Care, Shilajit, EverYoung and future products.

## Behavior and limits

- Current Shopify documentation permits up to 1024 metaobject references in a list. This implementation handles that list in batches of 50 rather than a single Liquid loop. Target roughly 50–100 entries per product for reasonable page weight; validate large lists on Shopify before release.
- Load more progressively reveals server-rendered cards. It is not server-side pagination: all review text and image elements are rendered initially. Images are lazy loaded and responsive, but the gallery can still create network work as users browse it. For hundreds of photos, consider server-side pages and stored aggregate totals in a later version.
- Without JavaScript, all reviews remain visible and gallery links target their cards. With JavaScript, mobile cards swipe horizontally, load more reveals the next batch, and photo clicks open the full review (or reveal/focus the card if the dialog is disabled/unavailable).
- Native dialog provides keyboard trapping and Escape dismissal; the close button restores focus. No external JavaScript libraries, font requests or review services are required.
- Storefront-visible feedback is public. The section does not collect reviews, verify purchases or process consent itself.
- No aggregateRating JSON-LD is added, avoiding conflicts with existing product schema or review apps. Search result stars are not promised.
- The local existing testimonial/homepage content is separate and unchanged. Its claims and verification labels need their own content audit.
- A live Liquid render and browser/device review require authenticated Shopify access and supplied records. Local linting alone cannot verify record permissions or the deployed theme.

## Live verification checklist

- Confirm store identity is cuehealth.in; inspect current Dawn theme, plan and existing review apps/definitions.
- Definition keys and types match exactly; storefront access is enabled; approved entries are Active.
- Images resolve from Shopify CDN and show the correct customer, with truthful alt text.
- Each product shows only matching records. Check two different products and an accidental mismatched reference.
- Compare average/count against approved data; test an unrated review and a product with no reviews.
- Test 51+ genuine entries to confirm no truncation after 50, and load more through the final card.
- Check mobile widths (including 320px), swipe, gallery, desktop 2/3/4 columns and long Hindi/English feedback.
- Tab to photos, open a dialog, close with Escape/button, and confirm focus returns. Test the dialog-disabled mode.
- Disable JavaScript: all cards should remain visible and links usable.
- Test theme editor section reloads and settings changes.
- Confirm the old placeholder is removed from the chosen template and no fixed averages or unsupported verification badges remain in the published experience.
- Check product media, variant selection, cart and checkout entry points still work.
- Review actual image loading/performance and browser console in the preview.
- Publish only after preview verification; inspect the public product URL afterward.

## Editor demo cards

When a product has no genuine reviews, the theme editor can show three SAMPLE/DEMO cards with that product’s existing Shopify CDN image. Turn off **Show demo cards in editor** to hide them. The placeholders have no customer claims or verification labels, never contribute to rating/count totals, and never render on the public storefront. No demo Shopify records are created.
