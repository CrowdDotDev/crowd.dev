# Git Integration Tests

## Overview

Tests commit and activity extraction from real git repositories using actual git commands.

## Structure

```
test/
├── conftest.py                      # Pytest configuration (env vars)
├── fixtures/
│   ├── test_repo_seed.json          # Defines test commits
│   ├── build_test_repo.py           # Builds git repo from seed
│   ├── test-repo/                   # Test git repository
│   ├── expected_activities.json     # Expected output baseline
│   └── actual_output.json           # Current test output
└── test_activity_extraction.py      # Test suite
```

## Running Tests

```bash
make test                                       # Run all tests
make test test=test_activity_extraction.py      # Specific test
make test repo=insights                         # Test different repo (from repos/)
make test expected=insights_expected.json       # Custom baseline (from fixtures/)
make test repo=insights expected=insights_expected.json  # Combined
```

**Note:** `repo` and `expected` arguments are relative to `repos/` and `fixtures/` directories respectively.

## How It Works

1. **Test repository** created from `test_repo_seed.json` with various commit scenarios
2. **CommitService** processes commits using real git commands
3. **Activities captured** via mocked database (no actual DB writes)
4. **Output compared** with expected baseline using deep equality check

## Test Coverage

- All activity types (authored, committed, signed-off, reviewed, tested, co-authored)
- File statistics (insertions/deletions from git numstat)
- Edge cases (malformed emails, unusual formats)
- Complete structure validation (all fields compared)

## Updating Baseline

1. Run tests: `make test`
2. Review `outputs/test-repo_actual.json`
3. If correct: `cp outputs/test-repo_actual.json outputs/test-repo_expected.json`
4. Commit the expected file to git
5. Re-run to validate

## Adding Test Cases

Edit `fixtures/test_repo_seed.json`, rebuild repo, update baseline:

```bash
cd src/test
rm -rf repos/test-repo
python3 fixtures/build_test_repo.py
cd ../..
make test
cp src/test/outputs/test-repo_actual.json src/test/outputs/test-repo_expected.json
git add src/test/outputs/test-repo_expected.json
```

## Testing External Repositories

To test with a real repository:

```bash
# Clone repo into repos/ directory
cd src/test/repos
git clone https://github.com/yourorg/yourrepo.git insights

# Run test to generate output (first run will skip validation)
cd ../../..
make test repo=insights
# Output saved to: outputs/custom/insights_actual.json

# Review output and create baseline
cp src/test/outputs/custom/insights_actual.json src/test/outputs/custom/insights_expected.json

# Future runs automatically validate against the baseline
make test repo=insights
```

**Note:** Custom repo baselines are in `outputs/custom/` which is gitignored. They're for local validation only.
