# Intent Intake Questions

Idea: Add a GET /api/version endpoint to the backend returning {"name": "conduit", "version": <backend package.json version>}, with a unit test. Single small story, minimal change.

Please fill in the `[Answer]:` tag for each question.

## Question 1
Which business outcome or metric should this move (KPI)?

A) Faster deployment verification (time to confirm which build is live)
B) Fewer support or debugging escalations caused by unknown deployed versions
C) Reliability of monitoring and health checks (tooling can read the running version)
D) None, this is internal hygiene with no tracked metric
E) Other (please describe after [Answer]: tag below)

[Answer]: D

## Question 2
What would "better" look like (directional success signal only)?

A) Anyone can confirm the deployed backend version with a single request
B) Deploy pipelines or monitors can read the version automatically
C) Both A and B
D) Other (please describe after [Answer]: tag below)

[Answer]: A

## Question 3
What is explicitly out of scope? (Choose the closest; the minimal-change instruction already excludes frontend work, git commit hash, build metadata, and auth changes.)

A) Frontend display of the version, plus commit hash or build metadata in the response
B) Authentication or rate limiting on the endpoint
C) Both A and B
D) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 4
Are there any known hard constraints?

A) None known
B) Must stay unauthenticated and public
C) Must not add new dependencies
D) Both B and C
E) Other (please describe after [Answer]: tag below)

[Answer]: C

## Question 5
How confident are you that this is worth doing, and what is the biggest open unknown?

A) High confidence, no major unknowns
B) Medium confidence, unknown: how the version will be consumed
C) Low confidence, unknown: whether the endpoint is needed at all
D) Other (please describe after [Answer]: tag below)

[Answer]: A
