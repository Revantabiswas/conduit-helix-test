Feature: Confirm the deployed backend version with one request

  Background:
    Given the Conduit backend is running
    And backend/package.json declares version "1.0.0"

  @AC-1
  Scenario: Version request returns name and version
    When a client sends GET /api/version
    Then the response status is 200
    And the response content type is JSON
    And the response body is exactly {"name":"conduit","version":"1.0.0"}

  @AC-1
  Scenario: Response contains no extra fields
    When a client sends GET /api/version
    Then the response body has exactly 2 fields, "name" and "version"

  @AC-2
  Scenario: Version matches package.json
    Given backend/package.json declares version "2.3.4"
    When the backend starts and a client sends GET /api/version
    Then the response body version is "2.3.4"

  @AC-2
  Scenario: Backend refuses to start when package.json cannot be read
    Given backend/package.json is missing or unreadable
    When the backend starts
    Then startup fails with an error
    And no request is served with a wrong version

  @AC-3
  Scenario: No credentials needed
    Given the request carries no Authorization header
    When a client sends GET /api/version
    Then the response status is 200

  @AC-3
  Scenario: Version route wins over the catch-all 404
    When a client sends GET /api/version
    Then the response status is not 404
    But a GET to an unknown path such as /api/unknown still returns 404 with {"errors":{"body":["Not found"]}}

  @AC-4
  Scenario: Unit test covers the endpoint
    When the repository's vitest suite for tests/unit/backend runs
    Then the version unit test at tests/unit/backend/routes/version.test.js passes and asserts status, JSON content type, exact body, package.json match and no credentials

  @AC-5
  Scenario: No dependency added and existing routes unchanged
    When the change is reviewed
    Then no package.json dependency or devDependency differs from before
    And GET /api/tags still responds as before
