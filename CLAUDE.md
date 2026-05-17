# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`madgrades-dle` is a new project built on top of UW-Madison grade data. The repository currently contains two source components: The purpose of this project is to use the other two projects to create a website that gives users a daily question about the data. 

- `madgrades-extractor/` — Java/Maven CLI that parses UW-Madison registrar PDFs into relational CSV/SQL output
- `madgrades-data/` — The PDF data source (grade reports and DIR reports from the registrar)

## madgrades-extractor (Java/Maven)

### Build & Run

```bash
cd madgrades-extractor

# Build the fat JAR (targets Java 8, requires JDK 17 per CI)
mvn package

# Run against the local madgrades-data directory
java -jar -Xmx6g target/madgrades-final-1.0-SNAPSHOT.jar \
  -reports ../madgrades-data \
  -out ./output \
  -f MYSQL

# Extract a single term (e.g. term 1262)
java -jar target/madgrades-final-1.0-SNAPSHOT.jar \
  -reports ../madgrades-data \
  -t 1262 \
  -out ./output

# List all available term codes
java -jar target/madgrades-final-1.0-SNAPSHOT.jar \
  -reports ../madgrades-data \
  -l
```

CI runs `mvn package` on push to `master` and uploads the JAR as an artifact.

### Architecture

The extraction pipeline runs per-term:

1. **`Scrapers`** — scans `madgrades-data/dir/` and `madgrades-data/grades/` directories, parses filenames (`{termCode}-dir.pdf`, `{termCode}-grades.pdf`) to build a map of term code → file path.

2. **`Pdfs`** — uses [tabula-java](https://github.com/tabulapdf/tabula-java) to extract rows from PDFs using hardcoded column x-coordinates defined in `Constants`. Column layouts differ by term code (special cases for 1124 and ≥1204 for DIR; 1224 for grades).

3. **`Parse`** — converts raw `PdfRow` objects into typed entry objects:
   - `dirEntry()` → `SubjectCodeEntry`, `SubjectNameEntry`, or `SectionEntry`
   - `gradeEntry()` → `SubjectCodeEntry`, `SubjectAbbrevEntry`, `CourseNameEntry`, or `SectionGradesEntry`

4. **`Term`** — accumulates sections from DIR entries and grade data from grade entries. `Term.generateCourseOfferings()` cross-lists courses by matching sections across subjects.

5. **`TermReports`** — holds all terms; `generateTables()` assembles the full relational output using `Mappers` static functions, deduplicating instructors, schedules, and rooms by UUID/ID.

6. **`Exporters`** — writes `Multimap<String, Map<String, Object>>` (table name → rows) to either CSV (`opencsv`) or MySQL INSERT statements.

### Database Schema

Output tables (defined in `src/main/resources/mysql_create_tables.sql`):

- `courses` — unique course by UUID (stable across terms), number, name
- `course_offerings` — a course in a specific term; linked to `courses`
- `sections` — individual sections within an offering (lecture, discussion, lab)
- `grade_distributions` — per-section grade counts (A, AB, B, BC, C, D, F, S, U, CR, N, P, I, NW, NR, OTHER) and computed GPA
- `instructors`, `teachings` — who taught each section
- `schedules`, `rooms` — meeting time/location, deduplicated by UUID
- `subjects`, `subject_memberships` — subject areas (e.g. "Computer Sciences / COMP SCI") linked to offerings

### Static Resources

- `aefis_courses.csv` — maps subject abbreviation + course number → full course name (loaded at startup to enrich course records)
- `subject_areas.csv` — canonical subject code/abbreviation/name list

## madgrades-data (PDF Data Source)

PDFs are organized as:
- `grades/{termCode}-grades.pdf` — percentage grade distribution reports
- `dir/{termCode}-dir.pdf` — Final Department Instructional Reports

Term codes end in `2` (spring), `4` (fall), or `6` (summer). Summer terms have no grade reports.

### Data Pipeline (Docker)

```bash
# Build: clones madgrades-extractor, builds it, runs extraction
docker build -t madgrades-data ./madgrades-data

# Run: outputs SQL table files to a local directory
docker run -v /path/to/output:/mnt madgrades-data
```

On push to `main`, CI builds and pushes `ghcr.io/madgrades/madgrades-data:latest`, then dispatches a `submodule-updated` event to the downstream `Madgrades/reports` repo.

### Adding a New Semester

Add `{termCode}-grades.pdf` to `madgrades-data/grades/` and `{termCode}-dir.pdf` to `madgrades-data/dir/`, then submit a PR. An administrator must merge to trigger the pipeline.
