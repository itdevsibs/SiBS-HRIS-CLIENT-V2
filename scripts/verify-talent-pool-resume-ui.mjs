import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  "src/components/modals/talentPool/CandidateProfileModal.jsx",
  "utf8",
);

assert.match(source, /getTalentPoolResumePdf/);
assert.match(source, /isGeneratingResume/);
assert.match(source, /handleGenerateResume/);
assert.match(source, />\s*Generate Resume\s*</);
assert.match(source, /Generating\.\.\./);

const generateIndex = source.indexOf("Generate Resume");
const statusButtonIndex = source.indexOf("handleUpdateCandidateStatus", generateIndex);
assert.ok(generateIndex >= 0 && statusButtonIndex > generateIndex);

console.log("PASS: Talent Pool resume action UI contract");
