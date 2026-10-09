# Diagrams

Interactive diagrams of Airsc, generated with [Archify](https://github.com/tt-a1i/archify) from the code at commit `f6d9e7d`. Download an `.html` file and open it in a browser; every node links to its source lines on GitHub.

| Diagram | HTML | Source JSON |
| --- | --- | --- |
| System architecture: request paths, MCP, Ko-fi webhook, Content Engine and its services | [airsc-architecture.html](airsc-architecture.html) | [airsc-architecture.json](airsc-architecture.json) |
| Content Engine run: Scout → Analyst → Curator → gate → kits → Producer → Demo → Editor, with budget and hide branches | [content-engine-workflow.html](content-engine-workflow.html) | [content-engine-workflow.json](content-engine-workflow.json) |

To regenerate after editing a JSON file:

```bash
node <archify>/bin/archify.mjs finalize architecture Diagrams/airsc-architecture.json Diagrams/airsc-architecture.html --repo-root . --quality showcase
node <archify>/bin/archify.mjs finalize workflow Diagrams/content-engine-workflow.json Diagrams/content-engine-workflow.html --repo-root . --quality showcase
```
