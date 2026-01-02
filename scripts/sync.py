import gzip
import json
import re
import subprocess
from os import listdir, unlink, rename
from os.path import isdir, isfile
from shutil import which, copyfile, rmtree

from nltk import download
from nltk.corpus import stopwords
from nltk.probability import FreqDist

GZ_PATH = which("gzip")
ARCHIVER_PATH = which("twitch-archiver")
WORD_BREAK = re.compile("[^a-z]*(?:\\s+|$)[({['\"]*")
REPROCESS = False


def process_vod(path: str):
    new_path = re.sub(" -.*- ", "_", path)
    if (path != new_path) and isdir(new_path):
        rmtree(path)
        return
    if isfile(path + "readable_chat.txt"):
        unlink(path + "readable_chat.txt")
    out_file = path + "processed_chat.json.gz"
    if not REPROCESS and isfile(out_file):
        if isfile(path + "verbose_chat.json"):
            unlink(path + "verbose_chat.json")
        with gzip.open(out_file, "rb") as file:
            return json.loads(file.read())
    users = {}
    uncompressed = isfile(path + "verbose_chat.json")
    if uncompressed:
        with open(path + "verbose_chat.json", encoding="utf-8") as file:
            chat = json.load(file)
    else:
        with gzip.open(path + "verbose_chat.json.gz") as file:
            chat = json.load(file)
    for message in chat:
        if message["commenter"]:
            user = message["commenter"]["login"]
        else:
            user = "deleted_user"
        if user not in users:
            users[user] = {
                "name": (
                    message["commenter"]["displayName"]
                    if message["commenter"]
                    else "deleted_user"
                ),
                "firstMessage": message["createdAt"],
                "badges": message["message"]["userBadges"],
                "color": message["message"]["userColor"],
                "terms": [],
            }
        users[user]["terms"].append(
            " ".join(
                [
                    (
                        f"{fragment["text"]}:{fragment["emote"]["emoteID"]}:e"
                        if fragment["emote"] and "emoteID" in fragment["emote"]
                        else fragment["text"]
                    )
                    for fragment in message["message"]["fragments"]
                ]
            )
        )
    for _, user in users.items():
        user["nMessages"] = len(user["terms"])
        user["terms"] = dict(
            FreqDist(
                term
                for term in WORD_BREAK.split((" ".join(user["terms"])).lower())
                if term and term not in exclude
            )
        )
    processed = {"chats": users}
    with open(path + "vod.json", encoding="utf-8") as file:
        processed["stream"] = {
            k: v
            for k, v in json.load(file).items()
            if k in ["vod_id", "title", "created_at", "duration"]
        }
    with gzip.open(out_file, "wb") as file:
        file.write(json.dumps(processed).encode())
    if GZ_PATH and uncompressed:
        subprocess.run([GZ_PATH, path + "verbose_chat.json", "-9"], check=False)
    rename(path, new_path)
    return processed


if __name__ == "__main__":

    with open("scripts/channels.txt", encoding="utf-8") as file:
        channels = file.readlines()
        for channel in channels:
            subprocess.run(
                [
                    ARCHIVER_PATH,
                    "-c",
                    channel.strip(),
                    "-C",
                    "-a",
                    "-d",
                    "data",
                    "-I",
                    "scripts/record",
                ],
                check=False,
            )

    download("stopwords")
    exclude = list(stopwords.words("english"))
    channels = listdir("data")
    for channel in channels:
        channel_path = f"data/{channel}/"
        processed_file = f"public/channel/{channel}.json.gz"
        with gzip.open(processed_file, "wb") as final_file:
            final_file.write(
                json.dumps(
                    list(
                        processed
                        for processed in [
                            process_vod(f"{channel_path}{vod_path}/")
                            for vod_path in listdir(channel_path)
                        ]
                        if processed
                    )
                ).encode()
            )
        copyfile(processed_file, f"docs/channel/{channel}.json.gz")
