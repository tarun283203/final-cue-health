/**
 * Cuehealth product review API — POST to submit, GET to list.
 *
 * Writes real customer-submitted reviews into Shopify as Draft
 * `cuehealth_review` metaobjects (see docs/cuehealth-reviews-setup.md).
 * Nothing a visitor submits is public until you set it Active in
 * Shopify Admin -> Content -> Metaobjects -> Cuehealth Review.
 *
 * SETUP
 * 1. Shopify Admin -> Settings -> Apps and sales channels -> Develop apps
 *    -> Create an app -> Configure Admin API scopes. Enable:
 *      read_products, write_products, read_metaobjects,
 *      write_metaobjects, read_files, write_files
 *    Install the app, then reveal the Admin API access token.
 * 2. In this Apps Script project: Project Settings -> Script properties.
 *    Add SHOPIFY_STORE = cuehealth.in (or the .myshopify.com domain) and
 *    SHOPIFY_ADMIN_TOKEN = the token from step 1. Never put the token in
 *    code, in this repo, or anywhere client-side.
 * 3. Deploy -> New deployment -> Web app. Execute as "Me", access "Anyone".
 * 4. Paste the /exec URL into the "Review submission URL" setting of the
 *    Cuehealth Reviews section in the Shopify theme editor.
 */

var API_VERSION = '2025-01';

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  var store = props.getProperty('SHOPIFY_STORE');
  var token = props.getProperty('SHOPIFY_ADMIN_TOKEN');
  if (!store || !token) throw new Error('Missing SHOPIFY_STORE or SHOPIFY_ADMIN_TOKEN script property.');
  return { store: store, token: token };
}

function shopifyGraphQL_(query, variables) {
  var config = getConfig_();
  var url = 'https://' + config.store + '/admin/api/' + API_VERSION + '/graphql.json';
  var response = UrlFetchApp.fetch(url, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'X-Shopify-Access-Token': config.token },
    payload: JSON.stringify({ query: query, variables: variables || {} }),
    muteHttpExceptions: true
  });
  var body = JSON.parse(response.getContentText());
  if (body.errors) throw new Error('Shopify GraphQL error: ' + JSON.stringify(body.errors));
  return body.data;
}

function jsonOut_(obj, callback) {
  if (callback) {
    return ContentService.createTextOutput(callback + '(' + JSON.stringify(obj) + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** POST — submit a new review as a Draft metaobject. */
function doPost(e) {
  try {
    var p = e.parameter;
    if (!p.productId) throw new Error('Missing productId.');
    if (!p.name || !p.reviewText) throw new Error('Missing name or review text.');

    var productGid = /^gid:\/\//.test(p.productId) ? p.productId : 'gid://shopify/Product/' + p.productId;

    var imageGid = null;
    if (p.imageBase64 && p.imageFilename) {
      imageGid = uploadImage_(p.imageBase64, p.imageFilename, p.imageMimeType || 'image/jpeg');
    }

    var fields = [
      { key: 'reviewer_name', value: String(p.name).slice(0, 120) },
      { key: 'review_text', value: String(p.reviewText).slice(0, 2000) },
      { key: 'product_reference', value: productGid },
      { key: 'review_date', value: new Date().toISOString().slice(0, 10) }
    ];
    var rating = parseInt(p.rating, 10);
    if (rating >= 1 && rating <= 5) fields.push({ key: 'rating', value: String(rating) });
    if (p.location) fields.push({ key: 'location', value: String(p.location).slice(0, 80) });
    if (imageGid) {
      fields.push({ key: 'customer_image', value: imageGid });
      fields.push({ key: 'image_alt_text', value: 'Customer review photo' });
    }

    var data = shopifyGraphQL_(
      'mutation CreateReview($metaobject: MetaobjectCreateInput!) {' +
      '  metaobjectCreate(metaobject: $metaobject) {' +
      '    metaobject { id }' +
      '    userErrors { field message code }' +
      '  }' +
      '}',
      { metaobject: { type: 'cuehealth_review', capabilities: { publishable: { status: 'DRAFT' } }, fields: fields } }
    );
    var result = data.metaobjectCreate;
    if (result.userErrors && result.userErrors.length) throw new Error(JSON.stringify(result.userErrors));
    var reviewGid = result.metaobject.id;

    appendReviewToProduct_(productGid, reviewGid);

    return jsonOut_({ status: 'ok', id: reviewGid }, p.callback);
  } catch (err) {
    return jsonOut_({ status: 'error', message: err.message }, e.parameter && e.parameter.callback);
  }
}

function uploadImage_(base64, filename, mimeType) {
  var staged = shopifyGraphQL_(
    'mutation StageUpload($input: [StagedUploadInput!]!) {' +
    '  stagedUploadsCreate(input: $input) {' +
    '    stagedTargets { url resourceUrl parameters { name value } }' +
    '    userErrors { field message }' +
    '  }' +
    '}',
    { input: [{ resource: 'IMAGE', filename: filename, mimeType: mimeType, httpMethod: 'POST' }] }
  );
  var target = staged.stagedUploadsCreate.stagedTargets[0];
  var blob = Utilities.newBlob(Utilities.base64Decode(base64), mimeType, filename);
  var payload = {};
  target.parameters.forEach(function (param) { payload[param.name] = param.value; });
  payload.file = blob;
  UrlFetchApp.fetch(target.url, { method: 'post', payload: payload, muteHttpExceptions: true });

  var created = shopifyGraphQL_(
    'mutation CreateFile($files: [FileCreateInput!]!) {' +
    '  fileCreate(files: $files) {' +
    '    files { id }' +
    '    userErrors { field message }' +
    '  }' +
    '}',
    { files: [{ alt: 'Customer review photo', contentType: 'IMAGE', originalSource: target.resourceUrl }] }
  );
  if (created.fileCreate.userErrors.length) throw new Error(JSON.stringify(created.fileCreate.userErrors));
  return created.fileCreate.files[0].id;
}

function appendReviewToProduct_(productGid, reviewGid) {
  var data = shopifyGraphQL_(
    'query ProductReviews($id: ID!) {' +
    '  product(id: $id) {' +
    '    metafield(namespace: "custom", key: "cuehealth_reviews") { value }' +
    '  }' +
    '}',
    { id: productGid }
  );
  var existing = [];
  var current = data.product && data.product.metafield;
  if (current && current.value) existing = JSON.parse(current.value);
  existing.push(reviewGid);

  var result = shopifyGraphQL_(
    'mutation SetReviews($metafields: [MetafieldsSetInput!]!) {' +
    '  metafieldsSet(metafields: $metafields) {' +
    '    userErrors { field message code }' +
    '  }' +
    '}',
    { metafields: [{ ownerId: productGid, namespace: 'custom', key: 'cuehealth_reviews', type: 'list.metaobject_reference', value: JSON.stringify(existing) }] }
  );
  if (result.metafieldsSet.userErrors.length) throw new Error(JSON.stringify(result.metafieldsSet.userErrors));
}

/** GET — list Active (published) reviews for a product. */
function doGet(e) {
  try {
    var p = e.parameter;
    if (!p.productId) throw new Error('Missing productId.');
    var productGid = /^gid:\/\//.test(p.productId) ? p.productId : 'gid://shopify/Product/' + p.productId;

    var data = shopifyGraphQL_(
      'query ProductReviews($id: ID!) {' +
      '  product(id: $id) {' +
      '    metafield(namespace: "custom", key: "cuehealth_reviews") { value }' +
      '  }' +
      '}',
      { id: productGid }
    );
    var ids = [];
    var current = data.product && data.product.metafield;
    if (current && current.value) ids = JSON.parse(current.value);
    if (!ids.length) return jsonOut_({ status: 'ok', reviews: [] }, p.callback);

    var nodesData = shopifyGraphQL_(
      'query ReviewNodes($ids: [ID!]!) {' +
      '  nodes(ids: $ids) {' +
      '    ... on Metaobject {' +
      '      id' +
      '      capabilities { publishable { status } }' +
      '      fields { key value }' +
      '    }' +
      '  }' +
      '}',
      { ids: ids }
    );

    var reviews = nodesData.nodes.filter(function (node) {
      return node && node.capabilities && node.capabilities.publishable && node.capabilities.publishable.status === 'ACTIVE';
    }).map(function (node) {
      var out = { id: node.id };
      node.fields.forEach(function (f) { out[f.key] = f.value; });
      return out;
    });

    return jsonOut_({ status: 'ok', reviews: reviews }, p.callback);
  } catch (err) {
    return jsonOut_({ status: 'error', message: err.message }, e.parameter && e.parameter.callback);
  }
}
