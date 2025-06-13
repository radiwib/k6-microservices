import http from 'k6/http';

export function post(url, payload, headers = {}) {
  return http.post(url, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

export function get(url, headers = {}) {
  return http.get(url, { headers });
}

export function patch(url, payload, headers = {}) {
  return http.patch(url, JSON.stringify(payload), {
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}
