from crowd.eagle_eye.sources.hacker_news import pre_process

with_text = {
    'by': 'jarrenae',
    'id': 32514823,
    'kids': [32516216, 32515059, 32515131],
    'score': 23,
    'text': 'Hi HN, I work with a mixed group of developers',
    'time': 1660856413,
    'title': 'Show HN: Quick Rewire – I made web tool to rewire your brain',
    'type': 'story',
    'url': 'https://www.quickrewire.com/'
}

without_text = {
    'by': 'pepys',
    'descendants': 59,
    'id': 32515067,
    'kids': [32517765,
             32518573,
             32519490,
             32518310,
             32517771,
             32518465,
             32518271,
             32517748,
             32518578,
             32518563,
             32518801,
             32516251,
             32518144,
             32518046,
             32516078],
    'score': 126,
    'time': 1660857735,
    'title': 'Dublin Whiskey Fire',
    'type': 'story',
    'url': 'https://en.wikipedia.org/wiki/Dublin_whiskey_fire'
}


def test_without_text():
    processed = pre_process([without_text])[0]

    payload = processed.payload

    # Test the payload class
    assert payload.vectorId == 'hacker_news:32515067'
    assert payload.sourceId == 'hacker_news:32515067'
    assert payload.title == 'Dublin Whiskey Fire'
    assert payload.url == 'https://news.ycombinator.com/item?id=32515067'
    assert payload.username == 'pepys'
    assert payload.timestamp == 1660857735
    assert payload.platform == 'hacker_news'
    assert payload.text == ''
    assert payload.destination_url == 'https://en.wikipedia.org/wiki/Dublin_whiskey_fire'
    assert payload.postAttributes == {
        'commentsCount': 59,
        'score': 126
    }

    # Test payload_as_dict
    assert processed.payload_as_dict() == {
        'destination_url': 'https://en.wikipedia.org/wiki/Dublin_whiskey_fire',
        'platform': 'hacker_news',
        'postAttributes': '{"commentsCount": 59, "score": 126}',
        'sourceId': 'hacker_news:32515067',
        'text': '',
        'timestamp': 1660857735,
        'title': 'Dublin Whiskey Fire',
        'url': 'https://news.ycombinator.com/item?id=32515067',
        'userAttributes': '{}',
        'username': 'pepys',
        'vectorId': 'hacker_news:32515067'
    }


def test_with_text():
    processed = pre_process([with_text])[0]
    payload = processed.payload

    # Test the payload class
    assert payload.vectorId == 'hacker_news:32514823'
    assert payload.sourceId == 'hacker_news:32514823'
    assert payload.title == 'Show HN: Quick Rewire – I made web tool to rewire your brain'
    assert payload.url == 'https://news.ycombinator.com/item?id=32514823'
    assert payload.username == 'jarrenae'
    assert payload.timestamp == 1660856413
    assert payload.platform == 'hacker_news'
    assert payload.text == 'Hi HN, I work with a mixed group of developers'
    assert payload.destination_url == 'https://www.quickrewire.com/'
    assert payload.postAttributes == {
        'commentsCount': 3,
        'score': 23
    }

    # Test payload_as_dict
    assert processed.payload_as_dict() == {
        'destination_url': 'https://www.quickrewire.com/',
        'platform': 'hacker_news',
        'postAttributes': '{"commentsCount": 3, "score": 23}',
        'sourceId': 'hacker_news:32514823',
        'text': 'Hi HN, I work with a mixed group of developers',
        'timestamp': 1660856413,
        'title': 'Show HN: Quick Rewire – I made web tool to rewire your brain',
        'url': 'https://news.ycombinator.com/item?id=32514823',
        'userAttributes': '{}',
        'username': 'jarrenae',
        'vectorId': 'hacker_news:32514823'
    }


if __name__ == '__main__':
    test_without_text()
    test_with_text()
