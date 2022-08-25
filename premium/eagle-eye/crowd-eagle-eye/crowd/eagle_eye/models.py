import hashlib
import json


class Payload:
    """
    Class to represent a payload, which is the readable information in a post.
    Attributes:
      - platform: Platform (hacker_news, dev.to...)
        - title: Title of the post
        - username: Username of the poster
        - timestamp: Timestamp of the post
        - postAttributes: Attributes of the post
        - url: URL of the post
        - destination_url: 
        - text: Text of the post
        - sourceId: ID of the post
        - userAttributes: userAttributes of the user
    """

    def __init__(self, id, platform, title, username, timestamp, url='',
                 destination_url='', text='', userAttributes=None, postAttributes=None):
        """
        Class constructor.

        Args:
            id (str): ID of the post
            platform (str): Platform (hacker_news, dev.to...)
            title (str): Title of the post
            username (str): Username of the poster
            timestamp (int): Timestamp of the post (unix timestamp)
            score (int): Score of the post
            url (str: . Url of the post Defaults to ''
            destination_url (str, optional): Destination URL of the post
            text (str, optional): Text of the post Defaults to ''
        """
        self.platform = platform
        self.title = title
        self.username = username
        self.timestamp = timestamp
        self.url = url
        self.destination_url = destination_url
        self.text = text
        self.sourceId = f'{platform}:{id}'
        self.vectorId = self.sourceId
        self.userAttributes = userAttributes if userAttributes else {}
        self.postAttributes = postAttributes if postAttributes else {}

    def to_dict(self):
        """
        Convert the payload to a dictionary.
        We need to convert the userAttributes and postAttributes to a string by using json.dumps.

        Returns:
            dict: dictionary representation of the payload
        """
        vs = vars(self)
        # Vector DB does not accept JSON, so we need to convert the userAttributes and postAttributes to a string.
        vs['postAttributes'] = json.dumps(vs['postAttributes'])
        vs['userAttributes'] = json.dumps(vs['userAttributes'])
        return vars(self)

    def __repr__(self):
        return f'Payload: {self.username} in {self.platform}: {self.title} ({self.timestamp})'


class Vector:
    """
    Class to represent a vector in the search engine.
    Attributes:
        - id: ID of the vector
        - payload: Readable post information. See Payload class.
        - combined: Title + text
        - embed: Embedded vector
    """

    def __init__(self, id, payload, combined='', embed=''):
        """
        Vector class constructor.

        Args:
            id (str): ID of the post
            payload (Payload or dict): Readable post information. See Payload class.
            combined (str, optional): Title + Text. Defaults to ''.
            embed (str, optional): Embedded vector. Defaults to ''.
        """
        # Pay
        self.payload = Payload(id, **payload) if type(payload) == 'dict' else payload
        self.id = self.sourceId = self.payload.vectorId
        self.combined = combined
        self.embed = embed

    @staticmethod
    def make_id(id, platform):
        """
        Construct a hashed id from the id of the post and the platform.

        Args:
            id (str | int): id of the post
            platform (str): platform

        Returns:
            str: hashed ID
        """
        return str(int(hashlib.sha256(f'{platform}-{id}'.encode('utf-8')).hexdigest(), 16) % 10**8)

    def payload_as_dict(self):
        """
        Get the Payload as a dict.

        Returns:
            dict: Payload as a dict.
        """
        return self.payload.to_dict()

    def __repr__(self):
        return f"""Vector({self.id}):
  - payload: {self.payload}
  - embedded: {self.embed != ''}
  - combined: {self.combined != ''}
  """
