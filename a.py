import json
import requests

# *********************************
# *****     CONFIGURATION     *****
# *********************************
CONTEST_ALIAS = 'ccms2023'
API_TOKEN = 'a599c38ac1a0527e92fcf302e62a5d7a4fc7fc96'
# The last hour
SCOREBOARD_FROZEN_DURATION_IN_SECONDS = 60 * 60


headers={
    'Authorization': 'token ' + API_TOKEN,
}

def get_scoreboard():
    url = "https://omegaup.com/api/contest/scoreboard/"
    response = requests.post(url, {'contest_alias': CONTEST_ALIAS}, headers=headers)
    return response.json()


def get_contest_details():
    url = "https://omegaup.com/api/contest/publicDetails/"
    response = requests.post(url, {'contest_alias': CONTEST_ALIAS}, headers=headers)
    # print(response.json())
    # exit(0)
    return response.json()


def get_users():
    url = "https://omegaup.com/api/contest/users/"
    response = requests.post(url, {'contest_alias': CONTEST_ALIAS}, headers=headers)
    return response.json()["users"]


def get_runs(runs_offset):
    url = 'https://omegaup.com/api/contest/runs/'
    request = requests.post(url, {
        'contest_alias': CONTEST_ALIAS,
        'show_all': 'true',
        'offset': runs_offset,
    }, headers=headers)
    return request.json()["runs"]


contest_details = get_contest_details()
scoreboard = get_scoreboard()
users = get_users()
# Links the problem alias with the problem letter
problem_alias_to_index = {problem["alias"]: chr(problem["order"] + 65) for problem in scoreboard["problems"]}
# Links the username to the name
usernameToName = {user["username"]: user["name"] for user in scoreboard["ranking"]}
out_data = {
    "contestMetadata": {
        "duration": contest_details["finish_time"] - contest_details["start_time"],
        # Scoreboard frozen during the last hour (in seconds)
        "frozenTimeDuration": SCOREBOARD_FROZEN_DURATION_IN_SECONDS,
        "name": contest_details["title"],
        "type": "ICPC",
        "scoreMode": "partial",
        "penaltyPerSubmission": contest_details["penalty"],
    },
    "problems": [{"index": chr(problem["order"] + 65)} for problem in scoreboard["problems"]],
    "contestants": [
        {"id": user_idx + 1, "name": f'{user["username"]}({usernameToName[user["username"]]})'}
        for user_idx, user in enumerate(users)
        if user["username"] in usernameToName
    ],
    # Possible verdicts
    "verdicts": {
        "accepted": ["AC"],
        "partiallyAccepted": ["PA"],
        "wrongAnswerWithPenalty": ["WA"],
        "wrongAnswerWithoutPenalty": ["CE"]
    },
    "submissions": [],
}

# Agrega los veredictos del concurso
idx = 1
puede = True
runs = []
offset = 0
contestStart = contest_details["start_time"]  # 1524061800
while True:
    print("Obteniendo problemas con offset", offset)
    actual_runs = get_runs(offset)
    for run in actual_runs:
        submissionTime = run["time"] - contestStart
        verdict = run["verdict"]
        user = f'{run["username"]}({usernameToName[run["username"]]})'
        if 0 < run["contest_score"] < 100:
            verdict = "PA"
        out_data["submissions"].append({
            "timeSubmitted": submissionTime,
            "contestantName": user,
            "problemIndex": problem_alias_to_index[run["alias"]],
            "verdict": verdict,
            "problemScore": run["contest_score"],
            "penalty": run["penalty"]
        })
    if len(actual_runs) == 0:
        break
    offset += 1

with open("out.txt", "w+", encoding="utf8") as jsonOutput:
    json.dump(out_data, jsonOutput, ensure_ascii=False, indent=2)

print("Done")
print("Paste the output of out.txt into neosaris")