# Mock Interview Backend Structure

```text
app/
├── config.py                         # Existing application settings
├── database.py                       # Existing MongoDB connection
├── main.py                           # FastAPI entry point
├── controllers/                      # Request/response orchestration
├── middlewares/                      # Auth, consent, rate limits, uploads
├── models/                           # Persistent database models
├── routes/                           # FastAPI routers
├── schemas/                          # Pydantic request/response contracts
├── services/                         # Shared integrations and business logic
└── modules/
    ├── interview_engine/             # 1, 2, 3, 10, 15
    ├── analysis/                     # 4, 5, 8, 9, 12
    ├── workspace/                    # 6, 7, 11
    ├── growth/                       # 13, 14, 16, 17, 18, 19
    └── recruiter/                    # 20
```

## Module responsibilities

| Module | Features |
| --- | --- |
| `interview_engine` | AI avatar, natural/follow-up conversation, company simulation, adaptive difficulty, stress mode, and STAR scoring. |
| `analysis` | Resume and JD parsing, speech/communication scoring, webcam body-language signals, and skill-gap reports. |
| `workspace` | Live coding sessions, code-review events, system-design whiteboard events, and recordings with timeline annotations. |
| `growth` | Learning roadmaps, practice hints, company comparisons, career coaching, XP/streaks/badges, and multilingual interview settings. |
| `recruiter` | Candidate reports, recordings, scorecards, and hiring recommendations. |

Keep the existing `api/v1/interview.py` route working while new capabilities are added one module at a time. Each completed module should expose a router in `routes`, a controller, schemas, database model(s), and service(s).
