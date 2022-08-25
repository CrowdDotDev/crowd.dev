from datetime import datetime
import pytz


class CrowdDateTime:
    @staticmethod
    def now():
        return datetime.now().replace(tzinfo=pytz.utc)

    @staticmethod
    def format(date):
        date = date.replace(tzinfo=pytz.utc)
        return date

    @staticmethod
    def date_time(*args):
        return CrowdDateTime.format(datetime(*args))

    @staticmethod
    def from_time_stamp(ts):
        if type(ts) == str:
            if "." in ts:
                ts = ts[: ts.find(".")]
        return CrowdDateTime.format(datetime.fromtimestamp(int(ts)))
