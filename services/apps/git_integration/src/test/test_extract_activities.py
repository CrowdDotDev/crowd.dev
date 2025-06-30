# -*- coding: utf-8 -*-

from crowdgit.activity import extract_activities, extract_activities_fuzzy


def test_extract_activities():
    # Test with a well-formed commit message
    commit_message = [
        "Signed-off-by: Arnd Bergmann <arnd@arndb.de>",
        "Reported-by: Guenter Roeck <linux@roeck-us.net>",
        "Reviewed-by: Manivannan Sadhasivam <mani@kernel.org>",
        "Signed-off-by: Linus Torvalds <torvalds@linux-foundation.org>",
    ]

    expected_activities = [
        {"Signed-off-by": {"email": "arnd@arndb.de", "name": "Arnd Bergmann"}},
        {"Reported-by": {"email": "linux@roeck-us.net", "name": "Guenter Roeck"}},
        {"Reviewed-by": {"email": "mani@kernel.org", "name": "Manivannan Sadhasivam"}},
        {"Signed-off-by": {"email": "torvalds@linux-foundation.org", "name": "Linus Torvalds"}},
    ]
    assert extract_activities(commit_message) == expected_activities

    # Test with a lower case commit message and several typos
    commit_message = [
        "accked-by: John Doe <john.doe@example.com>",
        "acked-and-reviewed by: Jane Smith <jane.smith@example.com>",
        "acked and--reviewed by: Jane Smith <jane.smith@example.com>",
    ]
    expected_activities = [
        {"Reviewed-by": {"name": "John Doe", "email": "john.doe@example.com"}},
    ]
    expected_activities_fuzzy = [
        {"Reviewed-by": {"name": "John Doe", "email": "john.doe@example.com"}},
        {"Reviewed-by": {"name": "Jane Smith", "email": "jane.smith@example.com"}},
        {"Reviewed-by": {"name": "Jane Smith", "email": "jane.smith@example.com"}},
    ]
    assert extract_activities(commit_message) == expected_activities
    assert extract_activities_fuzzy(commit_message) == expected_activities_fuzzy

    # Test with an empty commit message
    commit_message = []
    expected_activities = []
    assert extract_activities(commit_message) == expected_activities

    # Test with a commit message without activities
    commit_message = [
        "This is a commit message without any activities.",
        "It has multiple lines, but none of them contain activities.",
    ]
    expected_activities = []
    assert extract_activities(commit_message) == expected_activities

    # Test with various email formats
    commit_message = [
        "Reviewed-By: Alice <alice@example.com>",
        "Reviewed-By: Bob <<bob@example.com>",
        "Reviewed-By: Charlie <<charlie@example.com>>",
        "Reviewed-By: David <david@example.com>>",
    ]
    expected_activities = [
        {"Reviewed-by": {"name": "Alice", "email": "alice@example.com"}},
        {"Reviewed-by": {"name": "Bob", "email": "bob@example.com"}},
        {"Reviewed-by": {"name": "Charlie", "email": "charlie@example.com"}},
        {"Reviewed-by": {"name": "David", "email": "david@example.com"}},
    ]
    assert extract_activities(commit_message) == expected_activities

    real_commit_message = """"
    test: call toLowerCase on the resolved module
    The commit updates test-require-resolve.js to call toLowerCase on the
    resolved module instead of the path. Currently this test will fail if
    the path to where node exists contains uppercase letters. For example:

    ```
    $ out/Release/node
    test/parallel/test-require-resolve.js
    /root/rpmbuild/BUILD/node-v8.8.0/test/parallel
    module.js:515
        throw err;
        ^

    Error: Cannot find module
    '/root/rpmbuild/build/node-v8.8.0/test/fixtures/nested-index/one'
        at Function.Module._resolveFilename (module.js:513:15)
        at Function.resolve (internal/module.js:18:19)
        at Object.<anonymous>
    (/root/rpmbuild/BUILD/node-v8.8.0/test/parallel/test-require-resolve.js:37:11)
        at Module._compile (module.js:612:30)
        at Object.Module._extensions..js (module.js:623:10)
        at Module.load (module.js:531:32)
        at tryModuleLoad (module.js:494:12)
        at Function.Module._load (module.js:486:3)
        at Function.Module.runMain (module.js:653:10)
        at startup (bootstrap_node.js:187:16)
    ```

    PR-URL: #16486
    Reviewed-By: Luigi Pinca <luigipinca@gmail.com>>
    Reviewed-By: Ben Noordhuis <info@bnoordhuis.nl>>
    Reviewed-By: Colin Ihrig <cjihrig@gmail.com>>
    Reviewed-By: Anna Henningsen <anna@addaleax.net>>
    Reviewed-By: James M Snell <jasnell@gmail.com>>
    """

    expected_activities = [
        {"Reviewed-by": {"name": "Luigi Pinca", "email": "luigipinca@gmail.com"}},
        {"Reviewed-by": {"name": "Ben Noordhuis", "email": "info@bnoordhuis.nl"}},
        {"Reviewed-by": {"name": "Colin Ihrig", "email": "cjihrig@gmail.com"}},
        {"Reviewed-by": {"name": "Anna Henningsen", "email": "anna@addaleax.net"}},
        {"Reviewed-by": {"name": "James M Snell", "email": "jasnell@gmail.com"}},
    ]

    assert extract_activities(real_commit_message.split("\n")) == expected_activities
