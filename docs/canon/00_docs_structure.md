# ECKI AI@Workplace Wiki

This approach to documentation and context management heavily draws from the following two sources:

- [The Diátaxis Approach to Documentation](https://diataxis.fr/)
- [Basis - How We Made Our Monorepo Ergonomic for Agents](https://www.getbasis.ai/blogs/how-we-made-our-monorepo-ergonomic-for-agents)


## Basic Docs Structure

```
/canon
    /agents
    /tutorial
    /how-to
    /reference
    /explanation
/records
    /adrs
    /prds
    /mockups
/draft
<files...>
```

### Structure Explanation

| Category              | Question                                                 |
| --------------------- | -------------------------------------------------------- |
| Canon                 | What is true about the system / project right now?       |
| Records               | What happened and why?                                   |
| Draft                 | What is still in progress?                               |
|                       |                                                          |
| Agents                | What information is there for agents?                    |
| Tutorial / Onboarding | How do I learn this?                                     |
| How-To                | How do I accomplish a specific task                      |
| Reference             | What is the exact fact/syntax/definition?                |
| Explanation           | Why does it work this way/how should I think about this? |

## Canon vs Non-Canon

Every artifact in the repo is either a source of truth about the system/project as it is today, or a record of intent and history. It must never be both. Users and AI agents reading the codebase and documentation need an explicit map of what to trust as a description of reality and what to read as a record.

Canon: a source of truth about the system / project today:
- `docs/canon/**`
- `AGENTS.md`
- Agent skills
- docstrings, and local code comments for the code they describe

Not Canon: intent, history, hypothesis:
- `docs/records/**`
- `docs/draft/**`
- `docs/deprecated/**`
- GitHub issues
- PR descriptions
- other material not belonging to canon.