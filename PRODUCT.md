# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Fresh graduates and early-career job seekers in Bangladesh. They apply to many jobs at once through Bdjobs, LinkedIn, Facebook job groups, company career sites and referrals, usually tracking them in a notebook, an Excel sheet or not at all. Their job in the product: remember every application, know what stage each one is at, follow up on time, prepare for interviews, and understand how well their CV fits a job before or after applying. Each person uses the product alone; there are no recruiter or admin roles.

The product is judged by two audiences equally: these real job seekers, and NT Tech Innovation examiners grading it as a full-stack practical assessment (live demo, code walkthrough, live code change). It must work as a real product and read clearly as a demo.

## Product Purpose

KormoBihin is a personal job-application tracker. A candidate logs each application, moves it through a validated hiring workflow, records interview rounds, gets automatic flags for missed follow-ups and close deadlines, sees statistics about their search, and uses AI to compare a CV with a job description. Success means no application is forgotten, follow-ups happen, and the candidate learns which CV gaps and job sources are holding them back.

## Positioning

Built for the Bangladeshi job hunt specifically: the sources it tracks (Bdjobs, Facebook groups, company sites, referrals), salary in BDT, Asia/Dhaka dates, and an AI CV match that names the concrete missing skills for each job instead of a generic score.

## Operating Context

- Candidates paste job descriptions copied from job posts and keep one or more CV versions (e.g. "Frontend CV", "General CV"), added by pasting text or uploading a text-based PDF.
- Hiring stages: Wishlist → Applied → Shortlisted → Interview → Offer → Accepted, with Rejected and Declined as exits. Common Bangladeshi interview formats are recorded: written test, viva, technical, HR, phone.
- Used on laptops and phones.
- Demo account for examiners: `demo@kormobihin.app` / `Demo@1234`, seeded with 12 applications at real Bangladeshi employers.

## Capabilities and Constraints

- Email/password accounts; each user sees only their own data.
- Applications, CVs and interview rounds can be created, viewed, edited and deleted. Stage changes follow fixed rules (no skipping stages) and every change is kept in a timeline. A rejected or declined application can be reopened, which returns it to the stage it was closed from and is recorded in the timeline; Accepted is final.
- Automatic flags: "No response" after 21 days at Applied; "Deadline soon" within 3 days; "Deadline passed".
- Dashboard: applications by stage (pipeline), "Up next" (interviews, deadlines and follow-ups, most urgent first), and replies by job source with the best-replying source called out (a source needs at least 2 applications to count as best). Response, interview and offer rates and average days to first reply are computed by the stats API but are not shown on the dashboard.
- AI CV match through Groq (`openai/gpt-oss-120b`): score 0–100, Strong/Moderate/Weak, matched skills, missing skills, three improvement tips. Manual "Check match" only; on failure the user sees an honest error and a Retry, never an invented score. Results are guidance, not a hiring verdict.
- The AI match assumes the basics: experience with a tool or framework counts as knowing the fundamentals under it (React or Tailwind means HTML, CSS and JavaScript; GitHub means Git), and a fundamental is listed as missing only when nothing in the CV points to it. It judges only checkable requirements (skills, tools, qualifications, experience, education) and never lists or scores soft skills such as communication or teamwork. Borderline scores can vary by about ±10 between runs.
- English interface. Bangla CVs are untested.
- Stack is already decided in the codebase (Next.js, Prisma, PostgreSQL on Neon, deployed to Vercel).

## Brand Commitments

- Name: KormoBihin ("unemployed" in Bangla).
- Voice: warm and lightly playful. It owns the name with gentle humour, but stays encouraging, like a supportive senior who has been through the job hunt. Never mocks the user, never uses jokes in errors or bad news (rejections, failures).

## Evidence on Hand

- Real AI match results from the demo data, e.g. Brain Station 23 React role 90/100 (missing Jest), Therap Java role 30/100, Pathao intern role 85/100 (after the prompt was told to assume the basics, 18 Oct 2026).
- No testimonials, user counts, partner logos or press exist. Do not fabricate any.

## Product Principles

1. Never lose an application: capturing a job must be fast, and every change is recorded.
2. Nudge, don't nag: flags and reminders point to the next useful action.
3. Honest AI: show what the model found, its limits, and errors plainly; the person decides.
4. Private by default: a job search is personal; nothing is shared between users.
5. Demo-ready truth: every screen shows real data from the product, so it holds up in front of examiners.
