# Gyan Setu — How to Use This Platform

Simple guide for everyone using the platform: students, volunteers, staff, admins.

## Who can do what

| You are... | You can... |
|---|---|
| **Student** | apply for tours, take eligibility tests, fill forms, view your profile & results |
| **Volunteer** | manage assigned tours, log daily reports, submit expenses/travel, upload photos, get certificates |
| **Staff (EARC)** | view programme data, student data, documents |
| **Admin** | manage everything: tours, tests, forms, students, volunteers, finance, reports |
| **Super Admin** | everything admin can, plus assign roles to others |

## Getting started

```mermaid
flowchart LR
    A[Sign up / Sign in] --> B[Land on your dashboard]
    B --> C{What's your role?}
    C -->|Student| D[Student dashboard]
    C -->|Volunteer| E[Volunteer dashboard]
    C -->|Staff| F[Staff dashboard]
    C -->|Admin| G[Admin dashboard]
```

You only see the pages meant for your role. No setup needed — sign in and you're routed automatically.

## Student journey

```mermaid
flowchart TD
    A[Browse available tours] --> B[Apply for a tour]
    B --> C[Take eligibility test]
    C --> D{Selected?}
    D -- Yes --> E[Get access to volunteer resources]
    D -- No --> F[See result, can apply for future tours]
    E --> G[Fill required forms & reports]
```

- Tests can have multiple-choice, multi-select, or written questions.
- Objective questions are scored instantly. Written answers are checked by admin.
- You'll see your score and status once review is done.

## Volunteer journey

```mermaid
flowchart TD
    A[Get assigned to a tour] --> B[View tour & group details]
    B --> C[Submit daily activity log]
    B --> D[Upload photos/media]
    B --> E[Submit expenses & travel details]
    B --> F[Fill tour report at the end]
    A --> G[Download ID card & certificate]
```

## Admin journey

```mermaid
flowchart TD
    A[Create a tour] --> B[Build eligibility test]
    B --> C[Students apply & take test]
    C --> D[Review results, select students]
    D --> E[Assign volunteers to tours]
    E --> F[Track daily reports, expenses, media]
    F --> G[View analytics & generate reports]
```

Super Admin also handles: assigning staff roles, managing who is admin/volunteer/staff.

## Forms — how they work

Any form you see (daily report, application, feedback, etc.) works the same way everywhere:

```mermaid
flowchart LR
    A[Open the form] --> B[Fill in fields: text, dropdowns, dates, file uploads, etc.]
    B --> C[Submit]
    C --> D[Confirmation shown]
    D --> E[Admin can review your submission]
```

## Tests — how they work

```mermaid
flowchart LR
    A[Open test] --> B[Answer questions]
    B --> C{Question type}
    C -->|Multiple choice / Multi-select| D[Scored instantly]
    C -->|Written answer| E[Reviewed by admin]
    D --> F[Final score shown]
    E --> F
```

## Good to know

- All pages are role-protected — you can't accidentally see someone else's dashboard.
- Notifications keep you updated on applications, selections, and deadlines.
- Everything works on mobile and desktop.
