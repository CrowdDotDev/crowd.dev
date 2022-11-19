from sentence_transformers import SentenceTransformer


class EmbedAPI:
    """
    API for embedding vectors.
    """

    def __init__(self, truncate='LEFT'):
        """
        Embed constructor.

        Args:
            model (str, optional): Which model to use. Defaults to 'medium'.
            truncate (str, optional): LEFT or RIGHT. If the text is too long, 
                                      give preference to left or right hand side. 
                                      Defaults to 'LEFT'.
        """
        self.model = SentenceTransformer('distilbert-base-nli-stsb-mean-tokens')
        self.truncate = truncate

    def embed_points(self, points):
        """
        Embed a list of points.

        Args:
            points ([Point]): List of Points.

        Returns:
            [Point]: Same list of points, with the embed field filled in.
        """
        texts = [point.combined for point in points]
        embeds = self.embed_texts(texts)
        for point, embed in zip(points, embeds):
            point.embed = embed
        return points

    def embed_texts(self, texts):
        """
        Embed a list of texts

        Args:
            texts ([str]): list of texts to embed.

        Returns:
            [[[float]]]: list of vectors
        """
        vectors = []
        for text in texts:
            vectors.append(self.model.encode(text).tolist())

        return vectors

    def embed_one(self, text):
        """
        Embed one text.

        Args:
            text (str): text to embed   

        Returns:
            [[float]]: embed vector
        """
        return self.embed_texts([text, ])
