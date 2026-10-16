import type {
  InterviewOutcome,
  InterviewType,
  JobSource,
  Stage,
} from "../src/generated/prisma/enums";

export const DEMO_USER = {
  name: "Rahim Uddin",
  email: "demo@kormobihin.app",
  password: "Demo@1234",
};

// Second account used to demonstrate that users cannot see each other's data.
export const OTHER_USER = {
  name: "Nusrat Jahan",
  email: "nusrat@kormobihin.app",
  password: "Demo@1234",
};

export const RESUMES = {
  frontend: {
    label: "Frontend CV",
    content: `Rahim Uddin — Junior Frontend Developer, Dhaka
Education: BSc in Computer Science and Engineering, Daffodil International University (CGPA 3.52)
Skills: JavaScript, TypeScript, React, Next.js, Tailwind CSS, HTML, CSS, Redux Toolkit, REST API integration, Git, GitHub, Figma, responsive design
Projects:
- ShopBD: e-commerce frontend in Next.js and Tailwind with cart, checkout and bKash payment UI
- Weather dashboard in React consuming OpenWeather REST API with charts
Experience: 3-month frontend intern at a Dhaka software agency, built landing pages and fixed UI bugs
Languages: Bangla (native), English (professional)`,
  },
  general: {
    label: "General CV",
    content: `Rahim Uddin — Fresh Graduate, Dhaka
Education: BSc in Computer Science and Engineering, Daffodil International University (CGPA 3.52)
Skills: Microsoft Excel, data entry, communication, teamwork, basic SQL, Python basics, customer support, report writing
Experience: Part-time customer support executive (6 months) handling calls and emails; volunteer at university IT fair
Languages: Bangla (native), English (professional)`,
  },
};

type HistoryPlan = { path: Stage[] };

export type SeedApplication = {
  company: string;
  title: string;
  source: JobSource;
  location: string;
  salaryMin?: number;
  salaryMax?: number;
  resume: keyof typeof RESUMES | null;
  jobDescription: string;
  /** Stages in the order the application moved through them. */
  history: HistoryPlan;
  /** Days ago the application was created (first stage). */
  createdDaysAgo: number;
  /** Days between each stage change. */
  stepDays: number;
  /** Deadline in days from today (negative = already passed). */
  deadlineInDays?: number;
  jobUrl?: string;
  notes?: string;
  interviews?: {
    round: number;
    inDays: number;
    type: InterviewType;
    outcome: InterviewOutcome;
    notes?: string;
  }[];
};

export const APPLICATIONS: SeedApplication[] = [
  {
    company: "Brain Station 23",
    title: "Junior Frontend Developer (React)",
    source: "BDJOBS",
    location: "Dhaka (Mohakhali)",
    salaryMin: 30000,
    salaryMax: 40000,
    resume: "frontend",
    jobDescription:
      "We are looking for a Junior Frontend Developer with 0-1 years of experience. Must know JavaScript, React, HTML, CSS and REST API integration. Experience with TypeScript, Next.js and Tailwind CSS is a plus. Knowledge of Git and unit testing (Jest) preferred.",
    history: { path: ["WISHLIST", "APPLIED", "SHORTLISTED", "INTERVIEW"] },
    createdDaysAgo: 24,
    stepDays: 5,
    interviews: [
      {
        round: 1,
        inDays: -6,
        type: "WRITTEN",
        outcome: "PASSED",
        notes: "JS fundamentals + React MCQ",
      },
      {
        round: 2,
        inDays: 3,
        type: "TECHNICAL",
        outcome: "PENDING",
        notes: "Live coding with a senior dev",
      },
    ],
  },
  {
    company: "SELISE Digital Platforms",
    title: "Associate Software Engineer (Frontend)",
    source: "LINKEDIN",
    location: "Dhaka (Gulshan)",
    salaryMin: 45000,
    salaryMax: 55000,
    resume: "frontend",
    jobDescription:
      "Associate Software Engineer for Angular/React projects. Required: TypeScript, React or Angular, RxJS, REST, Git. Nice to have: Docker, CI/CD, Azure, unit testing. Good English communication required.",
    history: { path: ["WISHLIST", "APPLIED", "SHORTLISTED", "INTERVIEW", "OFFER"] },
    createdDaysAgo: 40,
    stepDays: 7,
    interviews: [
      { round: 1, inDays: -19, type: "TECHNICAL", outcome: "PASSED" },
      { round: 2, inDays: -12, type: "HR", outcome: "PASSED", notes: "Salary discussion" },
    ],
  },
  {
    company: "Pathao",
    title: "Frontend Engineer Intern",
    source: "COMPANY_SITE",
    location: "Dhaka (Gulshan 1)",
    salaryMin: 15000,
    salaryMax: 20000,
    resume: "frontend",
    jobDescription:
      "Frontend intern to work on rider and merchant dashboards. React, JavaScript, CSS required. Familiarity with Next.js, GraphQL and Storybook is a plus.",
    history: { path: ["WISHLIST", "APPLIED"] },
    createdDaysAgo: 30,
    stepDays: 2,
    notes: "No reply yet — consider a follow-up email.",
  },
  {
    company: "bKash Limited",
    title: "Management Trainee Officer (IT)",
    source: "BDJOBS",
    location: "Dhaka (Tejgaon)",
    resume: "general",
    jobDescription:
      "Management Trainee Officer for IT division. Fresh graduates in CSE/EEE. Strong analytical skills, SQL, Excel, presentation and communication skills. Written test followed by viva.",
    history: { path: ["WISHLIST", "APPLIED", "SHORTLISTED", "INTERVIEW", "REJECTED"] },
    createdDaysAgo: 50,
    stepDays: 8,
    interviews: [
      { round: 1, inDays: -26, type: "WRITTEN", outcome: "PASSED" },
      {
        round: 2,
        inDays: -18,
        type: "VIVA",
        outcome: "FAILED",
        notes: "Asked about banking regulations",
      },
    ],
  },
  {
    company: "Kaz Software",
    title: "Junior Software Engineer",
    source: "FACEBOOK",
    location: "Dhaka (Mohammadpur)",
    salaryMin: 35000,
    salaryMax: 45000,
    resume: "frontend",
    jobDescription:
      "Junior Software Engineer with knowledge of C#, .NET, JavaScript and SQL Server. React experience is a plus. Problem solving and OOP fundamentals are a must.",
    history: { path: ["WISHLIST", "APPLIED", "REJECTED"] },
    createdDaysAgo: 35,
    stepDays: 10,
  },
  {
    company: "Grameenphone",
    title: "Customer Service Executive",
    source: "BDJOBS",
    location: "Chattogram",
    salaryMin: 25000,
    salaryMax: 30000,
    resume: "general",
    jobDescription:
      "Customer service executive for GP Centre. Excellent Bangla and English communication, customer handling, MS Office, problem solving. Rotating shifts.",
    history: { path: ["WISHLIST", "APPLIED"] },
    createdDaysAgo: 26,
    stepDays: 1,
  },
  {
    company: "Shohoz",
    title: "React Developer",
    source: "LINKEDIN",
    location: "Dhaka (Banani)",
    salaryMin: 40000,
    salaryMax: 60000,
    resume: "frontend",
    jobDescription:
      "React Developer (1-2 years). React, Redux, TypeScript, REST API, Jest, Webpack. Experience with Next.js and server-side rendering preferred.",
    history: { path: ["WISHLIST"] },
    createdDaysAgo: 3,
    stepDays: 0,
    deadlineInDays: 2,
    jobUrl: "https://www.linkedin.com/jobs/",
  },
  {
    company: "Chaldal",
    title: "Software Engineer Trainee",
    source: "COMPANY_SITE",
    location: "Dhaka (Tejgaon)",
    resume: null,
    jobDescription:
      "Trainee software engineer. Strong problem solving (Codeforces/LeetCode), data structures and algorithms, any programming language. C# and React used internally.",
    history: { path: ["WISHLIST"] },
    createdDaysAgo: 1,
    stepDays: 0,
    deadlineInDays: 12,
  },
  {
    company: "Therap (BD) Ltd.",
    title: "Software Engineer (Java)",
    source: "BDJOBS",
    location: "Dhaka (Banani)",
    resume: "frontend",
    jobDescription:
      "Software Engineer with Java, Spring Boot, Hibernate, MySQL, JavaScript. Strong OOP and design patterns. Written exam and multiple technical interviews.",
    history: { path: ["WISHLIST", "APPLIED", "SHORTLISTED"] },
    createdDaysAgo: 14,
    stepDays: 4,
  },
  {
    company: "Robi Axiata",
    title: "Digital Marketing Intern",
    source: "REFERRAL",
    location: "Dhaka (Gulshan 2)",
    resume: "general",
    jobDescription:
      "Digital marketing intern. Social media content, Facebook Ads, Google Analytics, Canva, copywriting in Bangla and English.",
    history: { path: ["WISHLIST", "APPLIED", "SHORTLISTED", "INTERVIEW", "OFFER", "DECLINED"] },
    createdDaysAgo: 60,
    stepDays: 7,
    notes: "Declined — role was not related to software.",
  },
  {
    company: "Optimizely Bangladesh",
    title: "Junior Frontend Engineer",
    source: "LINKEDIN",
    location: "Dhaka (Remote friendly)",
    salaryMin: 50000,
    salaryMax: 70000,
    resume: "frontend",
    jobDescription:
      "Junior Frontend Engineer: React, TypeScript, CSS-in-JS, accessibility, testing with Jest and Cypress, Git. Exposure to GraphQL and design systems is a plus.",
    history: { path: ["WISHLIST", "APPLIED"] },
    createdDaysAgo: 9,
    stepDays: 2,
  },
  {
    company: "Dhaka Bank PLC",
    title: "Probationary Officer",
    source: "BDJOBS",
    location: "Dhaka",
    resume: "general",
    jobDescription:
      "Probationary Officer. Graduates from any discipline, good communication, MS Office, analytical ability. Written test (Math, English, General Knowledge) and viva.",
    history: { path: ["WISHLIST"] },
    createdDaysAgo: 10,
    stepDays: 0,
    deadlineInDays: -2,
  },
];

export const OTHER_USER_APPLICATION: SeedApplication = {
  company: "Private Example Ltd.",
  title: "HR Executive",
  source: "OTHER",
  location: "Sylhet",
  resume: null,
  jobDescription: "HR executive role. This record belongs to a different user.",
  history: { path: ["WISHLIST", "APPLIED"] },
  createdDaysAgo: 5,
  stepDays: 1,
};
