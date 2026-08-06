import assert from "node:assert/strict";
import test from "node:test";

import handler from "./redirect.js";

function responseRecorder() {
  return {
    headers: {},
    statusCode: null,
    body: null,
    setHeader(name, value) {
      this.headers[name] = value;
      return this;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
    end(data) {
      this.body = data;
      return this;
    },
  };
}

async function invoke({ method = "GET", url = "/", headers = {}, query = {} }) {
  const response = responseRecorder();
  await handler({ method, url, headers, query }, response);
  return response;
}

test("returns 302 for known view-link shortcode CqVzDRpP1Va", async () => {
  const response = await invoke({
    url: "/CqVzDRpP1Va",
    headers: { host: "view-link.cx" },
  });
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers["Location"], "http://127.0.0.1:9010");
  assert.equal(response.headers["Location"].endsWith(","), false);
});

test("returns 302 for known view-link shortcode IdBBrKLtr6M", async () => {
  const response = await invoke({
    url: "/IdBBrKLtr6M",
    headers: { host: "view-link.cx" },
  });
  assert.equal(response.statusCode, 302);
  assert.equal(response.headers["Location"], "http://localhost:9010");
});

test("returns 302 for known view-details shortcode", async () => {
  const response = await invoke({
    url: "/4a2pltzm9qF",
    headers: { host: "view-details.cx" },
  });
  assert.equal(response.statusCode, 302);
  assert.match(response.headers["Location"], /^https:\/\/poke\.com\/login-link\//);
});

test("returns 404 for unknown shortcode", async () => {
  const response = await invoke({
    url: "/unknown",
    headers: { host: "view-link.cx" },
  });
  assert.equal(response.statusCode, 404);
  assert.equal(response.body.ok, false);
});
