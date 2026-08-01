import { GitHubIcon, LinkedInIcon, XIcon, InstagramIcon, LeetCodeIcon } from "@/components/icons";
import { Procol, CISM } from "@/public";
import { BadgeSwissFranc } from "lucide-react";

export const RESUME_DATA = {
  name: "Aditya Verma",
  initials: "AV",
  location: "India, IND",
  locationLink: "https://www.google.com/maps/place/India",
  about: "Hey, I’m Aditya — a 21-year-old tech enthusiast and self-taught developer from India, passionate about building systems that scale. Currently working with FastAPI and Go to build MCP connectors and real-world software solutions. Focused on system design, reliability, and user experience. Strong foundation in DSA, but most interested in translating that into production-grade code that actually matters. Always thinking about: how systems work under the hood, what makes software reliable at scale, and building things people use.",
  aboutBulletPoints: [
    "Challenging myself to build a product",
    "Always learning new things",
  ],
  avatarUrl1: "/profile.png",
  avatarUrl2: "https://avatars.githubusercontent.com/u/122523624?v=4",
  personalWebsiteUrl: "https://aditya7.com",
  resumeUrl: "/Aditya_Verma_Resume.pdf",
  contact: {
    email: null,
    social: [
      {
        name: "LeetCode",
        url: "https://leetcode.com/u/Aadiverma07/",
        icon: LeetCodeIcon,
      },
      {
        name: "X",
        url: "https://x.com/KaplishAditya",
        icon: XIcon,
      },
      {
        name: "LinkedIn",
        url: "https://www.linkedin.com/in/adityaverma7099/",
        icon: LinkedInIcon,
      },
      {
        name: "Instagram",
        url: "https://www.instagram.com/vermaadi07/",
        icon: InstagramIcon,
      },
      {
        name: "GitHub",
        url: "https://github.com/AadiVerma/",
        icon: GitHubIcon,
      },
    ],
  },
  skills: [
    "Java",
    "TypeScript",
    "React",
    "NextJS",
    "Vite",
    "NodeJS",
    "TailwindCSS",
    "ShadcnUI",
    "Supabase",
    "Vercel",
    "Ruby",
    "Rails",
  ],
  currentlyBuilding: [
    {
      name: "GridHook",
      link: "https://github.com/AadiVerma/Gridhook-Backend",
      badges: ["MCP", "Go", "API", "Connectors", "Backend"],
      title: "GridHook",
      date: "Since August 2026",
      description:
        "GridHook is an MCP connector platform — add your API and it automatically gets converted into MCP tools, letting AI agents call your endpoints directly.",
      videoLink: "https://youtu.be/yaTP3GnzL34?si=o5-3GylMMRCoXDT2",
      projectDetailsLink: "https://github.com/AadiVerma/Gridhook-Backend",
    }
  ],
  My_Projects: [
    {
      name: "FitWave",
      link: "https://www.github.com/AadiVerma/FitWave",
      badges:["Fitness","Ai","Full Stack"],
      title: "FitWave",
      date:"September 2024 - November 2024",
      description:
        "FitWave is a fitness app that uses AI to create personalized workout plans and nutrition guides. It tracks user progress and provides real-time feedback. The app is designed to help users achieve their fitness goals efficiently.",
      imageLink: "https://res.cloudinary.com/dq93uuksm/image/upload/v1744980926/Screenshot_2025-04-18_182516_dohmrn.png",
      projectDetailsLink: "https://github.com/AadiVerma/FitWave",
    },
    {
      name: "Talentify",
      link: "https://talentify.netlify.app/",
      badges:["Talent","Full Stack","MERN"],
      title: "Talentify",
      date:"January 2025",
      description:
        "Talentify is an innovative platform designed to bridge the gap between talented individuals and opportunities that match their skills. Whether you're an artist, developer, writer, musician, or any kind of creative or professional, Talentify helps you showcase your abilities and connect with the right audience",
      imageLink: "https://res.cloudinary.com/dq93uuksm/image/upload/v1744981164/Screenshot_2025-04-18_182903_y3lp2h.png",
      projectDetailsLink: "https://github.com/AadiVerma/Talentify",
    },
    {
      name: "Mines",
      link: "https://mines-flax.vercel.app/",
      badges:["Mines","Gambling","Next Js","Fun"],
      title: "Mines",
      date:"June 2024",
      description:
        "Mines is a minimalist, fast-paced game where players uncover safe tiles while avoiding hidden mines. Inspired by the popular game on Stake.com, it challenges your luck and strategy in every click.",
      imageLink: "https://res.cloudinary.com/dq93uuksm/image/upload/v1744981079/Screenshot_2025-04-18_175957_j4five.png",
      projectDetailsLink: "https://github.com/AadiVerma/Mines",
    },
    {
      name: "Petnest",
      link: "https://pet-nest.vercel.app/",
      badges:["Pets","Full Stack","Next Js","NestJs"],
      title: "Petnest",
      date:"July 2024",
      description:
        "PetNest is a pet adoption and buying platform where users can find their perfect furry companions and even contribute funds to support pets in need of care and shelter.",
      imageLink: "https://res.cloudinary.com/dq93uuksm/image/upload/v1744981039/Screenshot_2025-04-18_180621_fgwnxa.png",
      projectDetailsLink: "https://github.com/AadiVerma/PETNEST",
    },
    {
      name: "Zerobase",
      link: "https://www.github.com/AadiVerma",
      badges: ["CRM", "BaaS"],
      title: "Zerobase CRM",
      date: "Since January 2025",
      description:
        "Platform connecting users with local businesses, improving discoverability and supporting community commerce. Onboarded 50+ businesses, attracted 1000+ unique users, and achieved 10k monthly visitors.",
      imageLink: "https://res.cloudinary.com/dq93uuksm/image/upload/v1785574738/Screenshot_2026-08-01_at_2.27.57_PM_eeq5fl.png",
      projectDetailsLink: "https://github.com/AadiVerma",
    },
  ],

  education: [
    {
      school: "Chitkara University",
      degree: "Bachelors, CGPA: 9.3",
      start: "2022",
      end: "2026",
      activities: "4 years studying Computer Science and Engineering, going deep on DSA, systems, and full-stack development while building real projects alongside coursework.",
      logo: CISM
    },
    {
      school: "BBMB DAV Public School",
      degree: "12th, 91%",
      start: "2008",
      end: "2022",
      activities: "14 years of foundational education, from LKG through 12th grade, building the discipline and fundamentals that led into Computer Science.",
      logo: "https://res.cloudinary.com/dq93uuksm/image/upload/v1785574899/LOGO_ifs5s2.png",
    },
  ],
  work: [
    {
      company: "Procol",
      link: "https://www.procol.io/",
      badges: ["Ruby on Rails", "Python", "FastAPI", "MCP", "Backend Developer"],
      title: "Software Engineer",
      logo: Procol,
      start: "June 2026",
      end: "Present",
      description:
        "Joined full-time as a Software Engineer after completing internship. Continuing to build and scale backend systems with Ruby on Rails and Python, developing production-grade APIs, and driving feature development across the platform.",
    },
    {
      company: "Procol",
      link: "https://www.procol.io/",
      badges: ["Ruby on Rails", "Python", "FastAPI", "MCP", "Backend Developer"],
      title: "Software Engineer Intern",
      logo: Procol,
      start: "April 2025",
      end: "June 2026",
      description:
        "Building backend solutions with Ruby on Rails and Python. Developing scalable APIs using FastAPI and implementing Model Context Protocol (MCP). Focused on writing clean, maintainable, production-ready code.",
    }
  ],
} as const;
