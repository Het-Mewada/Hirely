# Skills Taxonomy Design & Architecture Document

## Executive Summary
This document details the architectural rationale, inclusion/exclusion criteria, alias normalization strategy, and design trade-offs behind Hirely's **spaCy-powered Technical Skills Taxonomy & Entity Extractor**.

---

## 1. Domain Taxonomy Categories

Our curated taxonomy covers **100+ high-frequency technical skills** organized across 7 core software engineering domains:

| Category | Canonical Skills Included | Sample Pattern Aliases & Variants |
| :--- | :--- | :--- |
| **Programming Languages** | Python, JavaScript, TypeScript, Java, C++, C#, Go, Rust, Ruby, PHP, SQL, HTML, CSS, Bash, R, Swift, Kotlin | `JS`, `TS`, `Golang`, `CSharp`, `.NET`, `Python3`, `Py` |
| **Frontend Frameworks** | React, Next.js, Vue.js, Angular, Svelte, TailwindCSS, Redux, Bootstrap | `ReactJS`, `React.js`, `NextJS`, `VueJS`, `Tailwind CSS` |
| **Backend Frameworks** | FastAPI, Django, Flask, Node.js, Express.js, Spring Boot, Ruby on Rails, NestJS, GraphQL, REST API, Microservices | `DRF`, `Django REST Framework`, `NodeJS`, `ExpressJS`, `RESTful` |
| **Databases & Caching** | PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch, SQLite, Cassandra, DynamoDB, Firebase | `Postgres`, `Postgre`, `Mongo`, `Elastic Search`, `Firestore` |
| **Cloud & DevOps** | AWS, Azure, GCP, Docker, Kubernetes, Terraform, CI/CD, GitHub Actions, Nginx, Linux, Git | `EC2`, `S3`, `Lambda`, `K8s`, `CICD`, `GitHub`, `GitLab` |
| **AI / ML & Data Science**| PyTorch, TensorFlow, Scikit-Learn, Pandas, NumPy, spaCy, OpenCV, LLMs, LangChain | `Sklearn`, `Scikit Learn`, `Spacy`, `Large Language Models` |
| **Tools & Architecture** | Pytest, Jest, Jira, Postman, Vite, Webpack, Celery, RabbitMQ, Kafka, Agile, TDD | `Apache Kafka`, `Scrum`, `Test Driven Development` |

---

## 2. Inclusion & Exclusion Criteria Rationale

### What We Included (and Why)
1. **Industry-Standard Stack Keywords**: Focused on verifiable, domain-specific programming languages, frameworks, cloud providers, and databases commonly specified in job descriptions.
2. **Standard Acronyms & Shortform Aliases**: Included universal developer shorthand (e.g. `K8s` for Kubernetes, `TS` for TypeScript, `DRF` for Django REST Framework) to maximize recall on authentic candidate resumes.
3. **Canonical Normalization Mapping**: All pattern matches map to a single canonical skill string (`Postgres` -> `PostgreSQL`, `JS` -> `JavaScript`). This ensures clean ATS match scoring in subsequent pipeline phases.

### What We Excluded (and Why)
1. **Generic Soft Skills**: Excluded subjective buzzwords (e.g., *"hardworking"*, *"team player"*, *"fast learner"*, *"passionate"*). These cannot be objectively scored by an ATS matcher and create false-positive noise.
2. **Overly Broad English Words**: Excluded ambiguous single words like *"code"*, *"data"*, *"app"*, *"web"*, *"system"*, *"server"*, *"file"*. Matching these would pollute candidate skill profiles with false positives.
3. **Obsolete / Outdated Legacy Technologies**: Focused on modern, active software engineering stacks while omitting obsolete 1990s legacy tools (e.g., COBOL, Fortran, Pascal) unless explicitly needed for specialized enterprise roles.

---

## 3. Extraction Methodology

### spaCy `PhraseMatcher` (Case-Insensitive Exact Matching)
- **Tokenization-Aware**: Uses spaCy's `make_doc()` tokenizer to match multi-word phrases (e.g., `"Ruby on Rails"`, `"Amazon Web Services"`, `"Google Cloud Platform"`) accurately without split-token boundary errors.
- **`attr="LOWER"` Attribute Matching**: Matches phrases regardless of casing (e.g., `python`, `PYTHON`, `Python` all map to canonical `Python`).
- **Deduplication**: Automatically deduplicates matched canonical skills per candidate document.

### Experience & Education Extraction via NER
- **Experience Years**: Uses spaCy `DATE` NER entities and regex range matchers (`2018 - 2023`, `2020 - Present`) to calculate total career span in years.
- **Education Credentials**: Scans line-level text for degree patterns (`B.S.`, `B.Tech`, `M.S.`, `Ph.D`) coupled with spaCy `ORG` entities to extract academic background.

---

## 4. Design Trade-Offs

| Decision | Advantage | Trade-Off / Mitigation |
| :--- | :--- | :--- |
| **Curated Taxonomy vs. Open LLM** | Deterministic, ultra-fast (<10ms per resume), zero API cost, transparent auditability | Requires updating taxonomy as new tech stacks emerge. Mitigated by modular taxonomy dictionary design. |
| **spaCy PhraseMatcher vs. Regex** | Handles complex token boundaries, punctuation, and multi-word phrase matching cleanly | Requires loading spaCy NLP pipeline in memory (~50MB footprint). Mitigated by lazy singleton loading. |
