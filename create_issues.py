import json
import subprocess

with open("quorix_issues.json") as f:
    issues = json.load(f)

for issue in issues:
    title = issue["title"]
    body = issue["body"]
    subprocess.run(["gh", "issue", "create", "--title", title, "--body", body])
