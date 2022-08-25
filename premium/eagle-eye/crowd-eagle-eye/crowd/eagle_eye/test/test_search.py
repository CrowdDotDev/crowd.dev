from crowd.eagle_eye.search import remove_duplicates

out = [
    {
        'keywords': ['community'],
        'platform': 'devto',
        'postAttributes': {'tags': ['python', 'golf']},
        'similarityScore': 0.253364444,
        'sourceId': 'devto:1173887',
        'text': 'Golf Game Code           Progress            Today marks the day '
        'where I post my first project. I am...',
        'timestamp': 1661225580.0,
        'title': 'Golf Game',
        'url': 'https://dev.to/calebkumo/golf-game-470l',
        'userAttributes': {
            'organization': {},
            'user': {
                'githubUsername': 'calebkumo',
                'joinedAt': 'Jun 26, 2022',
                'location': None,
                'name': 'calebkumo',
                'summary': None,
                'twitterUsername': None,
                'website': ''
            }
        },
        'username': 'calebkumo',
        'vectorId': 'devto:1173887'
    },
    {
        'keywords': ['community'],
        'platform': 'devto',
        'postAttributes': {'tags': []},
        'similarityScore': 0.252538919,
        'sourceId': 'devto:1172752',
        'text': 'It takes quite a lot of time to keep updated on what is happening '
        'in the tech world. So I thought it...',
        'timestamp': 1661185702.0,
        'title': 'Interesting Things in Tech lately (2022 week 33)',
        'url': 'https://dev.to/amabdev/interesting-things-in-tech-lately-2022-week-33-210d',
        'userAttributes': {
            'organization': {},
            'user': {
                'githubUsername': None,
                'joinedAt': 'Jun 24, 2022',
                'location': '',
                'name': 'AmabDev',
                'summary': 'I am a passionate software developer '
                'attempting to learn in public.\n'
                'Feel free to reach out. I will be '
                'grateful for every opportunity to '
                'learn and improve.',
                'twitterUsername': 'AmabDev',
                'website': ''
            }
        },
        'username': 'amabdev',
        'vectorId': 'devto:1172752'
    },
    {
        'keywords': ['open source'],
        'platform': 'devto',
        'postAttributes': {'tags': []},
        'similarityScore': 0.4,
        'sourceId': 'devto:1172752',
        'text': 'It takes quite a lot of time to keep updated on what is happening '
        'in the tech world. So I thought it...',
        'timestamp': 1661185702.0,
        'title': 'Interesting Things in Tech lately (2022 week 33)',
        'url': 'https://dev.to/amabdev/interesting-things-in-tech-lately-2022-week-33-210d',
        'userAttributes': {
            'organization': {},
            'user': {
                'githubUsername': None,
                'joinedAt': 'Jun 24, 2022',
                'location': '',
                'name': 'AmabDev',
                'summary': 'I am a passionate software developer '
                'attempting to learn in public.\n'
                'Feel free to reach out. I will be '
                'grateful for every opportunity to '
                'learn and improve.',
                'twitterUsername': 'AmabDev',
                'website': ''
            }
        },
        'username': 'amabdev',
        'vectorId': 'devto:1172752'
    }
]


def test_deduplication_no_repeated_keywords():
    to_test = out[:2]
    assert len(to_test) == 2
    assert len(remove_duplicates(to_test)) == 2


def test_deduplication_repeated_keywords():
    to_test = out
    assert len(to_test) == 3

    no_dups = remove_duplicates(to_test)
    assert len(no_dups) == 2
    assert no_dups[1]['keywords'] == ['open source']
    assert no_dups[1]['similarityScore'] == 0.4
