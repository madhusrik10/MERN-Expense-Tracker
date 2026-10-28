import test from "node:test";
import assert from "node:assert/strict";
import authenticateToken, {
  signAuthToken,
} from "../middleware/authenticateToken.js";

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  },
});

test("rejects requests without a bearer token", () => {
  process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
  const response = createResponse();
  let nextCalled = false;

  authenticateToken(
    { headers: {}, body: { userId: "another-user" } },
    response,
    () => {
      nextCalled = true;
    }
  );

  assert.equal(response.statusCode, 401);
  assert.equal(response.body.code, "UNAUTHENTICATED");
  assert.equal(nextCalled, false);
});

test("uses the verified token subject instead of a body-supplied user id", () => {
  process.env.JWT_SECRET = "test-secret-with-more-than-thirty-two-characters";
  const request = {
    headers: {
      authorization: `Bearer ${signAuthToken("authenticated-user")}`,
    },
    body: { userId: "another-users-id" },
  };
  const response = createResponse();
  let nextCalled = false;

  authenticateToken(request, response, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(request.authenticatedUserId, "authenticated-user");
});
