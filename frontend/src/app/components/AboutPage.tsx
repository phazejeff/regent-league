"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";

const sections = [
  {
    title: "The Founder",
    text: "My name is David Rodriguez, but I go by RegentXD. I’m a graduate with a B.A in Ethnic Studies from University of California, San Diego and an M.S. in Accountancy from California State University, Long Beach. I’m 27 years old and I reside in Los Angeles, California. I’ve been involved in the collegiate space for esports for 8 years in different roles, such as organization president, esports player, caster, and many more.",
    image: "/Headshot_2.jpg",
  },
  {
    title: "What is RegentXD?",
    text: "RegentXD started as a name brand of myself, who incorporated my surroundings and history into a name that I saw suitable for me. My high school mascot was a Regent, my undergrad college representatives are Regents, and everywhere I was standing was Regent, Regent, Regent. The magic goes to Jimmy “Cullican” Tang, my former teammate at UCSD, who one night during an MM game saw a goofy play I made on Cache and proceeded to say “You really put the XD in RegentXD!” And from there, I knew my purpose: build that personality in the collegiate space for Counterstrike! Now, the brand has grown to be bigger than just an average collegiate gamer at UCSD and CSULB. It’s become an image of collegiate growth for Counterstrike and gaming in general. During my tenures in those respective colleges, I found not just a hobby, but a passion in the collegiate Counterstrike space.",
    image: "/XD_Emote.png",
  },
  {
    title: "Experience",
    text: `All of it started at Triton Gaming Expo in 2015 where I got to meet the Counterstrike club for Triton Gaming. Chatting with them and bonding led to finding a love and goal: play for the Counterstrike team. To which I worked a summer job for a PC in 2016 and got on my first collegiate team in 2017 for UCSD’s D2 team. From there, I competed for 3 years for the UCSD banner. Which included becoming the co-president of Triton Counterstrike in 2018. Where I hosted the ESL ONE NY 2019 watch party at UCSD and Triton Blackwatch LANding, the first exclusive collegiate tournament for Triton Counterstrike.

While maintaining close ties with my alma mater post-graduation, I wanted to continue my education in a different field. Once I found CSULB, I knew it was another shot to continue the CS experience. And so, I played for CSULB’s D1 team for the one year I had at the school. As much as I wanted to continue my esports experience there, my graduation called it quits.

The joy I felt playing for both schools and getting to feel that competitive fire influenced me to give other people, who don’t have an avenue of showing off their potential, a limelight. To which I became a collegiate caster in September 2024. A league and a few collegiate events later and I have established myself as a solid CS caster.

Pushing the effort to uplift collegiate CS further, I hosted my first collegiate tournament: RegentXD’s College Clash 2025. Where I hosted 11 teams from different schools across California and Washington to compete in a culmination of the 2024-25 collegiate season. With plenty of glowing reviews from the participants and those who spectated the event, I look to continue the effort with bigger events and better developments.`,
    image: "/TGEXcsgo-2_2.jpg",
  },
];

function Section({
  section,
  index,
}: {
  section: { title: string; text: string; image: string };
  index: number;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <div
      className={`flex flex-col md:flex-row gap-8 min-h-screen`}
    >
      {/* Sticky Image */}
      <div className="w-full md:w-1/2 relative">
        <div className="sticky top-24">
          <Image
            src={section.image}
            alt={section.title}
            width={600}
            height={400}
            className={`rounded-2xl ${index !== 1 ? "border-15 border-black" : ""}`}
          />
        </div>
      </div>

      {/* Scrolling Text */}
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 50 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full md:w-1/2 flex flex-col text-center md:text-left"
      >
        <h2 className="text-2xl font-semibold mb-4">{section.title}</h2>
        <p className="text-gray-50 whitespace-pre-line">{section.text}</p>
      </motion.div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen py-12 px-6">
      <h1 className="text-4xl font-bold text-center mb-12 text-white">
        About Us
      </h1>
      <div className="space-y-32 max-w-6xl mx-auto text-white">
        {sections.map((section, index) => (
          <Section key={index} section={section} index={index} />
        ))}
      </div>
    </div>
  );
}
