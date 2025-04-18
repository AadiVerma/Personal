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
    // "Created my startup videofast.gg - #2 Product of the Day on Product Hunt, 1.6k users",
    // "Created text-behind-image, a free tool with 30K users and #1 Product of the Day",
    // "Won international hackathons, eg. Apple Swift Student Challenge, ETHGlobal Online + more",   
    // "1k followers on X/Twitter",
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
      // logo: LB,
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
      imageLink: "https://private-user-images.githubusercontent.com/122523624/361158646-719f30cd-47f9-4675-b79b-7f26e56ba346.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDQ5Nzg3OTIsIm5iZiI6MTc0NDk3ODQ5MiwicGF0aCI6Ii8xMjI1MjM2MjQvMzYxMTU4NjQ2LTcxOWYzMGNkLTQ3ZjktNDY3NS1iNzliLTdmMjZlNTZiYTM0Ni5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwNDE4JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDQxOFQxMjE0NTJaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT03YjkyMmYyYmNkMTRhODQxOGNmODQwNzZmOTJlYjE4YzMzMmY4ZjJlMTRhZDUwNjhjNjg5NGNiNmI0NjM2Y2RmJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.qg3NwlTgUE2vhwd7tSUzDgSRBSWFKpazQKYqnD3q6J4",
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
      imageLink: "https://private-user-images.githubusercontent.com/122523624/405497213-68063040-9772-4054-b182-5d1685a7e7b8.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDQ5Nzg5NDAsIm5iZiI6MTc0NDk3ODY0MCwicGF0aCI6Ii8xMjI1MjM2MjQvNDA1NDk3MjEzLTY4MDYzMDQwLTk3NzItNDA1NC1iMTgyLTVkMTY4NWE3ZTdiOC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwNDE4JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDQxOFQxMjE3MjBaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT0xODFlYzZhNDI2ZGVlOTZhNDljZWY5NmUwZTAzY2QxNDBlOTlkOWZmYjJkYzVkYTEyYTcwMTFjMzRlYjQ5NDVjJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.F45LMRlb2pCzGslicskn5gd46449veK7Jz9v1Tq-hU0",
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
      imageLink: "https://private-user-images.githubusercontent.com/122523624/435188420-69b3988c-5177-4941-a572-aa18440cd03a.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDQ5Nzk4MzUsIm5iZiI6MTc0NDk3OTUzNSwicGF0aCI6Ii8xMjI1MjM2MjQvNDM1MTg4NDIwLTY5YjM5ODhjLTUxNzctNDk0MS1hNTcyLWFhMTg0NDBjZDAzYS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwNDE4JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDQxOFQxMjMyMTVaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT00YzE4ZTg3ZWEyZDk2MTcyY2U5Yjc0NDE3ZmEzYWI4ODU2MGI5OTg4ZGI3ZDgwOGNjODA0YWY0MDA0N2EwMmUzJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.MXL7SMEjjgdmnu-D5w9U-nqZ7Vqb7OSRZ_Q_vmRvkIs",
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
      imageLink: "https://private-user-images.githubusercontent.com/122523624/435190402-914412c1-97c8-4fcf-8a85-7f92db54e7ce.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDQ5ODAzMjMsIm5iZiI6MTc0NDk4MDAyMywicGF0aCI6Ii8xMjI1MjM2MjQvNDM1MTkwNDAyLTkxNDQxMmMxLTk3YzgtNGZjZi04YTg1LTdmOTJkYjU0ZTdjZS5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwNDE4JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDQxOFQxMjQwMjNaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT01MDRkYzUxOTkzN2E3MWJlMDVlYjkwOTFkM2E3MGQ5ZGUxMzA2ZmMzMTEyMzU2YzU0OWU1MjQwMTgyYzg0M2QxJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.7o4pZassw8J04gX72hnKK-DxSAKGCxWY2ghWIdYPrcA",
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
      imageLink: "https://private-user-images.githubusercontent.com/122523624/351199884-73933714-d355-4348-8105-2bb2390bea08.png?jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJnaXRodWIuY29tIiwiYXVkIjoicmF3LmdpdGh1YnVzZXJjb250ZW50LmNvbSIsImtleSI6ImtleTUiLCJleHAiOjE3NDQ5ODA1NjEsIm5iZiI6MTc0NDk4MDI2MSwicGF0aCI6Ii8xMjI1MjM2MjQvMzUxMTk5ODg0LTczOTMzNzE0LWQzNTUtNDM0OC04MTA1LTJiYjIzOTBiZWEwOC5wbmc_WC1BbXotQWxnb3JpdGhtPUFXUzQtSE1BQy1TSEEyNTYmWC1BbXotQ3JlZGVudGlhbD1BS0lBVkNPRFlMU0E1M1BRSzRaQSUyRjIwMjUwNDE4JTJGdXMtZWFzdC0xJTJGczMlMkZhd3M0X3JlcXVlc3QmWC1BbXotRGF0ZT0yMDI1MDQxOFQxMjQ0MjFaJlgtQW16LUV4cGlyZXM9MzAwJlgtQW16LVNpZ25hdHVyZT1kYjE3YWIxNjAxMjRiN2QyMjk1NmMxMzBmMTdlMGUwM2ZlNWY5YWQwNDlkMzk0MTk2YzVkN2UzMWY2ZDFhZGYxJlgtQW16LVNpZ25lZEhlYWRlcnM9aG9zdCJ9.tHSFbRsVO660jLfWzGlf4FOYbnvXVDztnCdlxDpxB9o",
      projectDetailsLink: "https://github.com/AadiVerma/RealTime-Tic-Tac-Toe",
    }

  ],

  education: [
    // {
    //   school: "Hong Kong International School",
    //   degree: "High school, currently a senior",
    //   start: "2020",
    //   end: "2025",
    //   activities: "I am a member of the Table Tennis Team and a leader of the Student Digital Leadership Team.  Academically, I have been in the honour roll every year at HKIS, given to students with a yearly GPA of 3.5-3.99.  I am also a teaching assistant for Advanced Computer Science Studio, the highest CS class in the school, helping the teacher prepare resources and provide help in class for students",
    //   logo: HKIS
    // },
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
    // {
    //   company: "City University of Hong Kong",
    //   link: "https://www.ee.cityu.edu.hk/prospective_students/Gifted_Education_Fund",
    //   badges: [],
    //   title: "Speaker and Mentor for the CityU-EE Gifted Education Programme on Cryptography, Blockchain, and Fintech",
    //   logo: CityUniversityLogo, 
    //   start: "5/2023",
    //   end: "12/2023",
    //   description:
    //     "The “Coding, Cryptography and FinTech (CCF) Skills Education for Gifted Students” programm is a programm aimed for the most gifted high school students around Hong Kong, teaching them about coding, cryptography, and fintech.  As a speaker and a mentor, I hosted workshops and lectures for the program to teach the students about these topics",
    // },
    // {
    //   company: "IEEE Blockchain Hong Kong",
    //   link: "https://www.artatechfin.com/",
    //   badges: [],
    //   title: "Mentor and Volunteer",
    //   logo: IEEELogo,
    //   start: "7/2022",
    //   end: "8/2022",
    //   description:
    //     "The IEEE Hong Kong Blockchain Local Group is the official blockchain group for Hong Kong under the Institute of Electrical and Electronics Engineers (IEEE)'s Hong Kong Section.   The IEEE HK Blockchain Local Group hosted a Web3 hackathon, targeted towards university students, to build Web3 applications and compete for prizes up to $100K HKD.  Over 100 teams joined, from 5 different universities across Hong Kong.  As a mentor, I was in charge of giving guidances and tips to the teams participating about the hackathon, as well as host mini workshops and create technical Youtube tutorials about blockchain development.  In addition, as a volunteer, I was in charge of setting up the venue and more, ensuring that the hackathon day in person was a smooth experience, as well as build the website for the hackathon",
    // },
    // {
    //   company: "Arta Tech Fin Corporation Limited",
    //   link: "https://www.artatechfin.com/",
    //   badges: ["Internship", "Hybrid"],
    //   title: "Summer Intern",
    //   logo: Arta,
    //   start: "7/2022",
    //   end: "8/2022",
    //   description:
    //     "During the summer of 2022, I interned at Arta Tech Fin as a blockchain research intern. My responsibilities included conducting research on blockchain technologies and their potential applications in the financial industry.  At Arta Tech Fin, I had the chance to work with experienced professionals in the financial industry and learn about the latest trends and developments in blockchain technology. I gained valuable insights into how blockchain can be used to solve problems and improve processes in the financial sector, and was able to contribute to the company's research efforts.",
    // },
    // { 
    //   company: "CryptoBLK Limited",
    //   link: "https://www.cryptoblk.io/",
    //   badges: ["Internship", "Hybrid"],
    //   title: "Summer Intern",
    //   logo: Cryptoblk,
    //   start: "6/2022",
    //   end: "8/2022",
    //   description:
    //     "At Cryptoblk, I had the opportunity to work with a talented team of developers and learn about the latest technologies and trends in the blockchain industry. I gained valuable experience in smart contract development and blockchain application development, and was able to contribute to a variety of projects that helped to improve the company's products and services.  I also worked with the business development team and IEEE HK Blockchain to host the Web3 Dev Hackathon 2022",
    // },
  ],
  dataScience: [
    {
      projectName: "Sitting Posture Buddy",
      projectDescription: "An iOS app that tracks your sitting posture in real time and alerts you when your posture becomes bad (like a cooked spaghetti noodle)",
      badges: ["iOS", "CoreML", "CreateML", "UIKit"],
      projectLink: "https://github.com/RexanWONG/sitting-posture-buddy"

    },
    {
      projectName: "Traning a model to play Doom from pixels",
      projectDescription: "A deep neural network that is trained to collect objects in a 3D environment based on the game of Doom, using Sample Factory, an asynchronous implementation of the PPO algorithm.",
      badges: ["Python", "Reinforcement learning", "Sample Factory", "VizDoom"],
      projectLink: "https://huggingface.co/rexanwong/rl_course_vizdoom_health_gathering_supreme"
    },
    {
      projectName: "Kangaroo or Giraffe",
      projectDescription: "A deep CNN image classifier that detects between a kangaroo or a giraffe",
      badges: ["Python", "Tensorflow", "Keras"],
      projectLink: "https://github.com/RexanWONG/kangaroo-or-giraffe"
    },
    {
      projectName: "Analyzing referee decisions in the EPL",
      projectDescription: 'Analyzing and uncovering patterns related to yellow card decisions and understand the tendencies of different referees in the english premier league from 2017-2022',
      badges: ["Python", "Numpy", "Pandas"],
      projectLink: "https://github.com/RexanWONG/analysis_referee_decisions_in_english_premier_league/blob/main/analyzing_referee_decisions_in_epl_2017_2022.ipynb"

    },
  ],
  music: [
    {
      awardName: "Grade 8 Piano Performance (Pass)",
      year: "2024",
      description: "Issued by The Associated Board of the Royal Schools of Music",
    },
    // {
    //   awardName: "Grade 7 Piano Performance (Distinction)",
    //   year: "2023",
    //   description: "Issued by The Associated Board of the Royal Schools of Music",
    // },
  ],
} as const;
