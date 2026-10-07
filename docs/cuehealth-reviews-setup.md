# Cuehealth photo reviews — setup and maintenance

## Status

The local checkout identifies itself as Dawn 15.4.1. Its product template now includes Cuehealth Reviews after related products. An existing Judge.me app section is preserved. The homepage uses a separate `customer-testimonials` section that includes a hardcoded 4.9 average, automatically labels reviews as verified purchases, and provides sample content in presets. Those existing files were not changed. Audit their published content before retaining them alongside this system.

The Shopify plugin is not connected in this Codex session. The CLI also requested login. The live store, Basic plan, currency, market, products, installed review apps, metaobjects and permissions have **not been verified**. No images or actual customer feedback have been supplied. No store records, uploads, theme pushes or publications have happened.

The new files implement the section locally. A Shopify connection or authenticated theme session is needed to inspect and implement remote setup; actual connector capabilities must be checked after connection. The existence of a Shopify connector does not establish that it supports metaobject creation or theme editing.

## Architecture

Customer feedback → merchant-owned `cuehealth_review` metaobject → Shopify image file reference → product metafield `custom.cuehealth_reviews` (ordered list of metaobject references) → `cuehealth-reviews` Liquid section.

A product list avoids scanning all reviews in the store. Product references inside the entries provide an additional filter. Featured photos lead the gallery; review cards retain the product list order. Rating averages include only ratings present and in the 1–5 range. Unrated reviews count toward the review count but not the rating denominator. There is no invented average, customer count or verification label. A visible statement explains that Cuehealth publishes the feedback on customers’ behalf.

Official references:
- https://shopify.dev/docs/apps/build/metaobjects
- https://shopify.dev/docs/apps/build/metafields/list-of-data-types
- https://shopify.dev/docs/apps/build/metafields/metafield-limits
- https://shopify.dev/docs/api/liquid/tags/paginate

## 1. Create the data definition

In Shopify Admin → Settings → Custom data → Metaobjects → Add definition (some admin versions also expose this through Content → Metaobjects → Add definition):

Name: **Cuehealth Review**. Type: **cuehealth_review**. Select reviewer_name as the display-name field. Enable storefront access and the Active/Draft capability. Keep entries Draft until their feedback, photo permission and any verification evidence have been reviewed. Enable storefront access for public fields. Do not put private original screenshots, phone numbers, purchase evidence or consent evidence in these publicly readable records.

Use these exact field keys. Select the equivalent type label in the current Shopify admin:

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

Shopify Admin → Content → Files → Upload files. Upload the supplied, permission-cleared customer photos first. Prefer properly oriented square JPEG/WebP images around 1000–1200 pixels, without private WhatsApp interface details. Keep the full uncropped source privately if needed. Shopify hosts the resulting images; select these image files in each entry's Customer image field. The section derives permanent Shopify CDN URLs with image_url; no local paths are embedded.

If using an API later, wait until Shopify reports the file ready and select its file ID/reference before creating an image-bearing review record. Do not use a temporary staged-upload URL as the final image URL.

## 3. Create and link genuine reviews

Content → Metaobjects → Cuehealth Review → Add entry. Fill the fields from real supplied feedback. Leave rating empty if it was not supplied or clearly supported. Map each image to the correct customer and product. Flag potentially problematic health claims for review before setting the entry Active; don't silently replace customer meaning with a different claim. Use consented public names and locations.

Open Products → the relevant product → Metafields → Cuehealth reviews → Select entries. Add that product's Active reviews and arrange the order. Save. An entry whose Product field does not match this product will be excluded even if accidentally selected. Empty names/text and unavailable Draft entries also do not display. Products without reviews show a truthful empty state.

Use the actual number supplied; do not fill a target of 50 with fabricated entries. `cuehealth-review-intake.csv` is an empty intake template with headers only, not a Shopify import file. Store original feedback, evidence and claim flags privately; publish only approved public fields.

## 4. Install the three theme files

Online Store → Themes → duplicate the current Dawn theme using its action menu. Work on that duplicate.

Open its action menu → Edit code:
1. Under Sections, create `cuehealth-reviews.liquid`. Paste the complete contents of the local `sections/cuehealth-reviews.liquid` and save.
2. Under Assets, create `cuehealth-reviews.css`. Paste the complete local CSS and save.
3. Under Assets, create `cuehealth-reviews.js`. Paste the complete local JavaScript and save.

Do not paste Markdown fences or rename the assets. No changes to layout/theme.liquid or main-product.liquid are needed.

Online Store → Themes → the duplicate → Customize/Edit theme → top template selector → Products → Default product (or the template assigned to your product). Select a product with linked reviews using the preview product selector. The repository default product template already includes **Cuehealth Reviews**. For other product templates, click **Add section → Cuehealth Reviews**. Place it beneath product details. Set heading, summary, photo gallery, reviews per load, dialog, desktop/mobile columns and spacing. Remove the old **Product reviews** placeholder from that template to avoid duplicate review sections. Save.

Repeat the section addition for any separate product templates. All products using one template share its section configuration but load their own records. New products need only their review entries and product metafield populated when they use an already configured template.

Preview and complete the checks below. Publish the duplicate only when satisfied. Creating these local files or saving a draft theme does not make the section live.

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
