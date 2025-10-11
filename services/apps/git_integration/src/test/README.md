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
make test                                    # Run all tests
make test test=test_activity_extraction.py   # Specific test
make test repo=/path/to/repo                 # Test external repo
make test expected=/path/to/expected.json    # Custom baseline
```

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
2. Review `fixtures/actual_output.json`
3. If correct: `cp fixtures/actual_output.json fixtures/expected_activities.json`
4. Re-run to validate

## Adding Test Cases

Edit `fixtures/test_repo_seed.json`, rebuild repo, update baseline:

```bash
cd src/test/fixtures
rm -rf test-repo
python3 build_test_repo.py
cd ../..
make test
cp fixtures/actual_output.json fixtures/expected_activities.json
```
