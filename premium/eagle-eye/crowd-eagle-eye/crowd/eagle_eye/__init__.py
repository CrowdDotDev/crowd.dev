from crowd.eagle_eye.config import KUBE_MODE

if not KUBE_MODE:
    import dotenv
    dotenv.load_dotenv()
