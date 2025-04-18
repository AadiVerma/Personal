import { GitHubIcon, LinkedInIcon, XIcon, InstagramIcon, LeetCodeIcon } from "@/components/icons";
import {
  CityUniversityLogo, EthGlobalLogo, LB,
  Procol, IEEELogo, ThirdwebLogo, Cosensys, DeveloperDao, Apple, Olympiad, Arta, Cryptoblk, HKIS, CISM, CAIS, VideoFast, TextBehindImage, Next, RT
} from "@/public";
import { BadgeSwissFranc } from "lucide-react";

export const RESUME_DATA = {
  name: "Aditya Verma",
  initials: "AV",
  location: "India, IND",
  locationLink: "https://www.google.com/maps/place/India",
  about: "Hey, I’m Aditya — a 20-year-old tech enthusiast and self-taught developer from India, with a strong interest in system-level problem solving, competitive programming, and building practical software solutions. I spend a lot of time sharpening my skills on platforms like LeetCode, diving into DSA, I’m fascinated by how systems work under the hood.I’m currently focused on growing as a full-stack developer, Always keeping performance and user experience in mind. I believe in learning by doing and I’m always curious about what I can build next",
  aboutBulletPoints: [
    "Challenging myself to build a product",
    "Always learning new things",
    "Looking for opportunities to grow and learn",
  ],
  avatarUrl1: "https://pbs.twimg.com/profile_images/1906680892556533760/NIswDg-F_400x400.jpg",
  avatarUrl2: "https://avatars.githubusercontent.com/u/122523624?v=4",
  personalWebsiteUrl: "https://aditya7.com",
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
        url: "https://www.instagram.com/aditya946verma/",
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
      name: "Zerobase",
      link: "https://www.github.com/AadiVerma",
      badges: ["CRM", "BaaS"],
      title: "Zerobase CRM",
      date: "Since January 2025",
      description:
        "Platform connecting users with local businesses, improving discoverability and supporting community commerce. Onboarded 50+ businesses, attracted 1000+ unique users, and achieved 10k monthly visitors.",
      videoLink: "https://youtu.be/yaTP3GnzL34?si=o5-3GylMMRCoXDT2",
      projectDetailsLink: "https://github.com/AadiVerma",
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
      name: "Tic Tac Toe",
      link: "https://github.com/AadiVerma",
      badges:["Fun","Full Stack","Game","Web-Sockets"],
      title: "Tic-Tac-Toe",
      date:"July 2024",
      description:
        "Tic Tac Toe is a classic 2-player game built for quick fun and strategy, where players take turns marking Xs and Os to win by aligning three in a row.",
      imageLink: "https://res.cloudinary.com/dq93uuksm/image/upload/v1744981233/Screenshot_2025-04-18_183029_e4sj5o.png",
      projectDetailsLink: "https://github.com/AadiVerma/RealTime-Tic-Tac-Toe",
    }

  ],

  education: [
    {
      school: "Chitkara University",
      degree: "Bachelors",
      start: "2022",
      end: "2026",
      activities: "Bachelors in Computer Science and Engineering",
      logo: CISM
    },
  ],
  work: [
    {
      company: "Procol",
      link: "https://www.procol.io/",
      badges: [" Ruby on Rails", "Backend Developer "],
      title: "Software Engineer Intern",
      logo: Procol,
      start: "2025",
      end: "Present",
      description:
        "Working on backend development using Ruby on Rails. Focused on building reliable, efficient systems and learning by doing.",
    }
  ],
} as const;
