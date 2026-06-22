import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { collectStaleIds, metadataSourcePath } from "./prune.js";

describe("collectStaleIds", () => {
  it("returns ids present in the database but absent from the content source", () => {
    assert.deepEqual(
      collectStaleIds(
        [
          { id: "db-1", sourceKey: "questions/ntu/2025/dsa/q01.md" },
          { id: "db-2", sourceKey: "questions/ntu/2025/dsa/q02.md" },
        ],
        new Set(["questions/ntu/2025/dsa/q02.md"]),
      ),
      ["db-1"],
    );
  });

  it("does not prune records without a source key", () => {
    assert.deepEqual(
      collectStaleIds(
        [
          { id: "manual", sourceKey: null },
          { id: "synced", sourceKey: "questions/ntu/2025/dsa/q01.md" },
        ],
        new Set<string>(),
      ),
      ["synced"],
    );
  });
});

describe("metadataSourcePath", () => {
  it("returns only non-empty sourcePath strings", () => {
    assert.equal(
      metadataSourcePath({ sourcePath: "admissions/114/ntu/departments.yml" }),
      "admissions/114/ntu/departments.yml",
    );
    assert.equal(metadataSourcePath({ sourcePath: "" }), null);
    assert.equal(metadataSourcePath({ sourcePath: 123 }), null);
    assert.equal(metadataSourcePath(null), null);
  });
});
