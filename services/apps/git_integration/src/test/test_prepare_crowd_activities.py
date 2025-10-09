from crowdgit.activity import prepare_crowd_activities

# Sample commit data for testing
commit_data = [
    {
        "hash": "123456",
        "datetime": "2022-02-02T11:04:37+02:00",
        "author_name": "John Doe",
        "author_email": "john@example.com",
        "committer_name": "John Doe",
        "committer_email": "john@example.com",
        "is_main_branch": True,
        "is_merge_commit": False,
        "insertions": 7,
        "deletions": 1,
        "message": [
            "Add new feature",
            "Signed-off-by: Jane Smith <jane@example.com>",
            "Co-authored-by: Another Person <another@person.com>",
        ],
    },
    {
        "hash": "789012",
        "datetime": "2022-02-03T11:04:37+03:00",
        "author_name": "Jane Smith",
        "author_email": "jane@example.com",
        "committer_name": "John Doe",
        "committer_email": "john@example.com",
        "is_main_branch": True,
        "is_merge_commit": False,
        "insertions": 5,
        "deletions": 2,
        "message": [
            "Fix bug",
            "Signed-off-by: Somebody Else <somebody@else.com>",
            "Reviewed-by: John Doe <john@example.com>",
        ],
    },
]


def test_prepare_crowd_activities():
    remote = "git://git.kernel.org/pub/scm/linux/kernel/git/torvalds/linux.git"
    activities = prepare_crowd_activities(remote, commit_data)
    activity_types = [
        (activity["type"], activity["member"]["emails"][0]) for activity in activities
    ]

    assert activities[0]["attributes"]["timezone"] == "UTC+02:00"

    assert activity_types == [
        ("authored-commit", "john@example.com"),
        ("committed-commit", "john@example.com"),
        ("co-authored-commit", "jane@example.com"),
        ("signed-off-commit", "jane@example.com"),
        ("co-authored-commit", "another@person.com"),
        ("authored-commit", "jane@example.com"),
        ("committed-commit", "john@example.com"),
        ("co-authored-commit", "somebody@else.com"),
        ("signed-off-commit", "somebody@else.com"),
        ("reviewed-commit", "john@example.com"),
    ]
