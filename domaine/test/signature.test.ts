import assert from "node:assert/strict";
import { test } from "node:test";

const { secretMatches, envelopeBody, eventState } = await import("../server/signature.ts");

test("the webhook secret must match exactly, and an empty secret is never accepted", () => {
  assert.equal(secretMatches("fictif-secret-000", "fictif-secret-000"), true);
  assert.equal(secretMatches("fictif-secret-001", "fictif-secret-000"), false);
  assert.equal(secretMatches("fictif", "fictif-secret-000"), false);
  assert.equal(secretMatches("", "fictif-secret-000"), false);
  assert.equal(secretMatches("", ""), false, "a missing secret on both sides is still a refusal");
});

test("a contract is addressed to the client as a signer, with a signature, a name and a date in fixed places", () => {
  const body = envelopeBody({ title: "Contrat fictif Alba & Bruno", email: "alba@example.test", name: "Alba Fictive" });
  assert.equal(body.type, "DOCUMENT");
  assert.equal(body.title, "Contrat fictif Alba & Bruno");
  assert.equal(body.recipients.length, 1);
  const [client] = body.recipients;
  assert.equal(client.role, "SIGNER");
  assert.equal(client.email, "alba@example.test");
  assert.equal(client.name, "Alba Fictive");
  assert.deepEqual(client.fields.map((f) => f.type), ["SIGNATURE", "NAME", "DATE"]);
  for (const f of client.fields) {
    assert.equal(f.page, 1);
    assert.ok(f.positionX >= 0 && f.positionX <= 100 && f.positionY >= 0 && f.positionY <= 100, "positions are percentages of the page");
  }
});

test("only a completed document marks the contract signed, a created one is still waiting, anything else is ignored", () => {
  assert.equal(eventState("DOCUMENT_COMPLETED"), "signed");
  assert.equal(eventState("DOCUMENT_CREATED"), "waiting");
  assert.equal(eventState("SOMETHING_ELSE"), "ignored");
  assert.equal(eventState(undefined), "ignored");
});
