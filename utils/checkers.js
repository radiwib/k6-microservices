import { check } from 'k6';

/**
 * ✅ Assert that the response status equals the expected value (default: 200)
 */
export function assertStatus(res, expected = 200) {
  check(res, {
    [`Status is ${expected}`]: (r) => r.status === expected,
  });
}

/**
 * ✅ Assert that the response time is below a maximum threshold (default: 500ms)
 */
export function assertResponseTime(res, maxMs = 500) {
  check(res, {
    [`Response time < ${maxMs}ms`]: (r) => r.timings.duration < maxMs,
  });
}

/**
 * ✅ Assert that a specific field exists in the JSON response body
 */
export function assertJsonFieldExists(res, field) {
  const body = res.json();
  check(body, {
    [`Field "${field}" exists in response`]: (b) => b[field] !== undefined,
  });
}

/**
 * ✅ Assert that a specific field in the JSON response body has the expected value
 */
export function assertJsonFieldValue(res, field, value) {
  const body = res.json();
  check(body, {
    [`Field "${field}" equals "${value}"`]: (b) => b[field] === value,
  });
}

/**
 * ✅ Assert that a specific field exists and is an array
 */
export function assertJsonArrayFieldExists(res, field) {
  const body = res.json();
  check(body, {
    [`Field "${field}" is an array`]: (b) => Array.isArray(b[field]),
  });
}

/**
 * ✅ Assert that a field exists inside a specific item (by index) of an array field
 */
export function assertJsonArrayItemFieldExists(res, arrayField, itemIndex, field) {
  const body = res.json();
  check(body, {
    [`Field "${field}" exists in item ${itemIndex} of "${arrayField}"`]: (b) =>
      b[arrayField] &&
      b[arrayField][itemIndex] &&
      b[arrayField][itemIndex][field] !== undefined,
  });
}

/**
 * ✅ Assert that a field inside a specific array item has a specific value
 */
export function assertJsonArrayItemFieldValue(res, arrayField, itemIndex, field, value) {
  const body = res.json();
  check(body, {
    [`Field "${field}" in item ${itemIndex} of "${arrayField}" equals "${value}"`]: (b) =>
      b[arrayField] &&
      b[arrayField][itemIndex] &&
      b[arrayField][itemIndex][field] === value,
  });
}

/**
 * ❌ Assert that the response has a specific error status and message
 */
export function assertErrorResponse(res, expectedStatus, expectedMessage) {
  check(res, {
    [`Error response status is ${expectedStatus}`]: (r) => r.status === expectedStatus,
    [`Error message is "${expectedMessage}"`]: (r) => r.json().message === expectedMessage,
  });
}

/**
 * ❌ Assert that the response body contains a specific error_key
 */
export function assertErrorResponseKey(res, expectedKey) {
  check(res, {
    [`Error key is "${expectedKey}"`]: (r) => r.json().error_key === expectedKey,
  });
}

/**
 * ✅ Assert that certain response headers exist and match expected values
 */
export function assertResponseHeaders(res, expectedHeaders) {
  const headers = res.headers;
  Object.keys(expectedHeaders).forEach((key) => {
    check(headers, {
      [`Header "${key}" exists`]: () => headers[key] !== undefined,
      [`Header "${key}" equals "${expectedHeaders[key]}"`]: () => headers[key] === expectedHeaders[key],
    });
  });
}
