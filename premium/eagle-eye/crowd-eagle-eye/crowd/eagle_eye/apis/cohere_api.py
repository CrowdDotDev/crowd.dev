import cohere
import os
from crowd.eagle_eye.config import KUBE_MODE, COHERE_API_KEY


class CohereAPI:
    """
    API for cohere.Client. Used to embed vectors.
    """

    def __init__(self, model='small', truncate='LEFT'):
        """
        Cohere constructor.

        Args:
            model (str, optional): Which model to use. Defaults to 'medium'.
            truncate (str, optional): LEFT or RIGHT. If the text is too long, 
                                      give preference to left or right hand side. 
                                      Defaults to 'LEFT'.
        """
        if KUBE_MODE:
            self.co = cohere.Client(COHERE_API_KEY)
        else:
            self.co = cohere.Client(os.environ.get("COHERE_API_KEY"))
        self.model = model
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
        return self.co.embed(
            texts=list(texts),
            model=self.model,
            truncate=self.truncate
        ).embeddings

    def embed_one(self, text):
        """
        Embed one text.

        Args:
            text (str): text to embed   

        Returns:
            [[float]]: embed vector
        """
        return self.embed_texts([text, ])
