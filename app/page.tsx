"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, AnimatePresence } from "framer-motion";
import {
  Mic,
  Video,
  Cloud,
  MessageSquare,
  Share2,
  Play,
  Menu,
  X,
  ArrowRight,
  Star,
  Zap,
  Globe,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <div className="bg-[#151515] min-h-screen text-white font-sans selection:bg-white/20 selection:text-white overflow-x-hidden">
      {/* Scroll Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-white origin-left z-50"
        style={{ scaleX }}
      />

      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  );
}

// --- Components ---

function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Features", href: "#features" },
    { name: "How It Works", href: "#how-it-works" },
    { name: "Testimonials", href: "#testimonials" },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className={`fixed top-0 w-full z-40 transition-all duration-300 border-b ${isScrolled
        ? "bg-[#151515]/80 backdrop-blur-xl border-white/10 py-4"
        : "bg-transparent border-transparent py-6"
        }`}
    >
      <div className="container mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="flex items-center space-x-2">
            <div className="bg-white p-1 rounded">
              <svg
                className="w-4 h-4 text-black"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M4 14l4-4 4 4" />
                <path d="M12 10l4 4 4-4" />
              </svg>
            </div>
            <span className="text-white font-bold tracking-widest text-lg">
              PODCAST
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group"
            >
              {link.name}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-white transition-all group-hover:w-full" />
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link
            href="/signin"
            className="px-5 py-2.5 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-all"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-white"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-[#151515] border-b border-white/10 overflow-hidden"
          >
            <div className="px-6 py-8 flex flex-col gap-6">
              {navLinks.map((link) => (
                <a
                  key={link.name}
                  href={link.href}
                  className="text-lg font-medium text-gray-300 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
              <div className="flex flex-col gap-4 mt-4">
                <Link
                  href="/signin"
                  className="text-center text-gray-300 hover:text-white"
                >
                  Sign In
                </Link>
                <Link
                  href="/signup"
                  className="px-5 py-3 rounded-full bg-white text-black text-center font-bold hover:bg-gray-200"
                >
                  Get Started Free
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
}

function Hero() {

  const router = useRouter();

  const handleDemoClick = () => {
    router.push("/demo");
  }
  return (
    <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-white/10 rounded-full blur-[100px] animate-pulse-slow" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-purple-500/10 rounded-full blur-[120px] animate-pulse-slow delay-1000" />
        <BackgroundGrid />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block px-4 py-1.5 rounded-full border border-white/30 bg-white/10 text-white text-xs font-semibold tracking-wider uppercase mb-6 backdrop-blur-sm">
              Schedule • Record • Share
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight leading-[1.1] mb-8"
          >
            Record Studio-Quality
            <br />
            Podcasts.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 relative">
              Anywhere.
              <svg
                className="absolute w-full h-3 -bottom-1 left-0 text-white opacity-50"
                viewBox="0 0 100 10"
                preserveAspectRatio="none"
              >
                <path
                  d="M0 5 Q 50 10 100 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  fill="none"
                />
              </svg>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-xl text-gray-400 mb-10 max-w-2xl leading-relaxed"
          >
            The easiest way to record remote interviews in studio quality (4K video
            & 48kHz audio). Schedule meetings, invite guests, and download recordings instantly.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <Link
              href="/signin"
              className="px-8 py-4 rounded-full bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all flex items-center gap-2"
            >
              Start Recording Free <ArrowRight className="w-5 h-5" />
            </Link>
      
            <button onClick={() => handleDemoClick()} className="px-8 py-4 rounded-full border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 backdrop-blur-sm text-white font-medium text-lg transition-all flex items-center gap-2 group">
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center group-hover:scale-110 transition-transform">
                <Play className="w-3 h-3 ml-0.5 fill-current" />
              </div>
              Watch Demo
            </button>
          </motion.div>
        </div>

        {/* Hero Image Mockup */}
        <motion.div
          initial={{ opacity: 0, y: 100, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          className="mt-20 relative max-w-5xl mx-auto [perspective:1000px]"
        >
          <div className="relative rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-[#1a1a1a] aspect-video group">
            <div className="absolute inset-0 bg-gradient-to-t from-[#151515] via-transparent to-transparent z-10" />

            {/* Mock UI Header */}
            <div className="absolute top-0 w-full h-12 bg-[#2a2a2a] border-b border-white/5 flex items-center px-4 gap-2 z-20">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <div className="flex-1 text-center text-xs text-gray-500 font-mono">recording_session_001.rec</div>
            </div>

            {/* Mock UI Content */}
            <div className="absolute inset-0 pt-12 p-4 grid grid-cols-2 gap-4">
              <div className="bg-[#2a2a2a] rounded-lg relative overflow-hidden flex items-center justify-center border border-white/5">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-2xl font-bold text-white/50">JD</div>
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs flex items-center gap-2">
                  <Mic className="w-3 h-3 text-green-400" /> John Doe (Host)
                </div>
              </div>
              <div className="bg-[#2a2a2a] rounded-lg relative overflow-hidden flex items-center justify-center border border-white/5">
                <div className="w-20 h-20 rounded-full bg-gray-600 flex items-center justify-center text-2xl font-bold text-white/50">JS</div>
                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded-full text-xs flex items-center gap-2">
                  <Mic className="w-3 h-3 text-green-400" /> Jane Smith (Guest)
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-12 top-1/2 bg-[#1c1c1c] border border-white/10 p-4 rounded-xl shadow-2xl z-30 w-48 hidden md:block"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-400 uppercase">Upload Complete</span>
              </div>
              <div className="h-1 w-full bg-gray-800 rounded-full overflow-hidden">
                <div className="h-full w-full bg-white" />
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute -left-8 bottom-12 bg-[#1c1c1c] border border-white/10 p-4 rounded-xl shadow-2xl z-30 w-56 hidden md:block"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg text-white"><Cloud className="w-5 h-5" /></div>
                <div>
                  <div className="text-sm font-bold text-white">Cloud Backup</div>
                  <div className="text-xs text-gray-500">Auto-synced to cloud</div>
                </div>
              </div>
            </motion.div>

          </div>
          {/* Reflective Shadow */}
          <div className="absolute -bottom-20 left-10 right-10 h-20 bg-white/10 blur-[80px] rounded-[100%]" />
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, y: [0, 10, 0] }}
          transition={{ delay: 2, duration: 2, repeat: Infinity }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 md:block hidden"
        >
          <div className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center p-1">
            <div className="w-1.5 h-1.5 bg-white/50 rounded-full" />
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Features() {
  const features = [
    {
      icon: Video,
      title: "4K Video Recording",
      description: "Record everyone's camera in up to 4K resolution. Crystal clear video, locally recorded.",
    },
    {
      icon: Mic,
      title: "Separate Audio Tracks",
      description: "Get uncompressed 48kHz WAV audio for every participant for total control in post-production.",
    },
    {
      icon: Globe,
      title: "Reliable Remote Recording",
      description: "Recordings are saved locally and uploaded progressively, so connection drops don't ruin your show.",
    },
    {
      icon: MessageSquare,
      title: "Public Viewing",
      description: "Allow audiences to join your session via public codes and watch the recording live.",
    },
    {
      icon: Share2,
      title: "Instant Downloads",
      description: "Download high-quality video and audio tracks immediately after your session ends.",
    },
    {
      icon: Users,
      title: "Up to 4 Guests",
      description: "Host large roundtable discussions or panels with support for up to 4 participants.",
    },
  ];

  return (
    <section id="features" className="py-24 relative overflow-hidden bg-[#151515]">
      <div className="container mx-auto px-6">
        <div className="mb-20">
          <SectionHeading title="Built for Professional Podcasters" />
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => (
            <FeatureCard key={idx} feature={feature} index={idx} />
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "Create a Studio",
      description: "Start an instant recording session or schedule one for later.",
      icon: Zap,
    },
    {
      title: "Invite Guests",
      description: "Send a simple code. Account required for your guests to join.",
      icon: Users,
    },
    {
      title: "Record in HD",
      description: "Local recording ensures quality isn't affected by bad internet.",
      icon: Mic,
    },
    {
      title: "Download",
      description: "Download high-quality video and audio tracks after your session ends.",
      icon: Cloud,
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#111111] relative border-y border-white/5">
      <div className="container mx-auto px-6">
        <div className="mb-20 text-center">
          <SectionHeading title="How It Works" />
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-white/0 via-white/50 to-white/0 md:-translate-x-1/2" />

          <div className="space-y-12 md:space-y-24">
            {steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className={`flex flex-col md:flex-row gap-8 items-start md:items-center ${idx % 2 === 1 ? "md:flex-row-reverse" : ""
                  }`}
              >
                {/* Number Badge */}
                <div className="absolute left-8 md:left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-[#151515] border-2 border-white flex items-center justify-center z-10 shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                  <span className="text-white text-xs font-bold">{idx + 1}</span>
                </div>

                {/* Content */}
                <div className={`md:w-1/2 pl-20 md:pl-0 ${idx % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12 md:text-left"}`}>
                  <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/30 transition-all hover:bg-white/10 group">
                    <div className={`mb-4 inline-flex p-3 rounded-lg bg-white/10 text-white group-hover:scale-110 transition-transform ${idx % 2 === 0 ? "md:float-right md:ml-4" : "md:float-left md:mr-4"}`}>
                      <step.icon size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{step.description}</p>
                  </div>
                </div>

                {/* Spacer for the other side */}
                <div className="hidden md:block md:w-1/2" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function Testimonials() {
  const testimonials = [
    {
      quote: "The reliability of local recording is a game changer for us.",
      author: "Sarah Chen",
      role: "Host, Tech Talk Daily",
      avatar: "SC",
    },
    {
      quote: "My workflow is 10x faster with the automatic cloud sync.",
      author: "Marcus Johnson",
      role: "True Crime Weekly",
      avatar: "MJ",
    },
    {
      quote: "Finally, remote interviews that actually sound like a studio.",
      author: "Priya Patel",
      role: "Business Insider Pod",
      avatar: "PP",
    },
    {
      quote: "The ability for my audience to join and watch live is fantastic.",
      author: "David Miller",
      role: "Creator, The Startup",
      avatar: "DM",
    },
    {
      quote: "Best investment we made for our distributed podcast team.",
      author: "Jessica Lee",
      role: "Remote Works",
      avatar: "JL",
    },
  ];

  return (
    <section id="testimonials" className="py-24 bg-[#151515] overflow-hidden">
      <div className="container mx-auto px-6 mb-16">
        <SectionHeading title="Loved by Podcasters Worldwide" />
      </div>

      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-[#151515] to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#151515] to-transparent z-10" />

        <Marquee direction="left" speed={30}>
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} data={t} />
          ))}
        </Marquee>
        <div className="h-8" />
        <Marquee direction="right" speed={25}>
          {testimonials.map((t, i) => (
            <TestimonialCard key={i} data={t} />
          ))}
        </Marquee>
      </div>
    </section>
  );
}

function FinalCTA() {
  return (
    <section className="py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-[#151515] to-[#0a0a0a] z-0" />
      <div className="absolute inset-0 z-0 opacity-30">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-6xl font-bold text-white mb-8 tracking-tight"
        >
          Ready to sound <span className="text-white underline decoration-white/30 underline-offset-8">Professional?</span>
        </motion.h2>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Link href="/signin" className="inline-flex items-center gap-3 px-10 py-5 rounded-full bg-white text-black text-xl font-bold hover:bg-gray-200 transition-all">
            <Mic className="w-6 h-6" /> Start Recording Now
          </Link>
        </motion.div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-12 mb-12">
          <div className="col-span-1 md:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center">
                <Mic className="w-5 h-5 text-black" />
              </div>
              <span className="text-xl font-bold text-white">Podcast</span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">
              The professional remote content creation studio. Record 4K video and high-quality audio tracks.
            </p>
          </div>

          {[
            { title: "Product", links: ["Features", "Enterprise", "Changelog"] },
            { title: "Company", links: ["About", "Blog", "Careers", "Contact"] },
            { title: "Legal", links: ["Privacy", "Terms", "Security", "Cookies"] },
          ].map((col, idx) => (
            <div key={idx}>
              <h4 className="text-white font-bold mb-6">{col.title}</h4>
              <ul className="space-y-4">
                {col.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <a href="#" className="text-gray-500 hover:text-white text-sm transition-colors">{link}</a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-600 text-sm">© {new Date().getFullYear()} Podcast Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

// --- Helpers & Subcomponents ---

function SectionHeading({ title }: { title: string }) {
  return (
    <div className="text-center">
      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-3xl md:text-5xl font-bold text-white relative inline-block pb-4"
      >
        {title}
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: "100%" }}
          viewport={{ once: true }}
          transition={{ duration: 1, delay: 0.2 }}
          className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-transparent via-white to-transparent w-full"
        />
      </motion.h2>
    </div>
  )
}

function FeatureCard({ feature, index }: { feature: any; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      whileHover={{ y: -10, rotateX: 2, scale: 1.02 }}
      className="p-8 rounded-2xl bg-white/5 border border-white/10 hover:border-white/50 hover:bg-white/10 backdrop-blur-sm transition-all group perspective-500"
    >
      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mb-6 text-white group-hover:bg-white group-hover:text-black transition-colors">
        <feature.icon className="w-6 h-6" />
      </div>
      <h3 className="text-xl font-bold text-white mb-3 group-hover:text-white transition-colors">{feature.title}</h3>
      <p className="text-gray-400 leading-relaxed group-hover:text-gray-300">
        {feature.description}
      </p>
    </motion.div>
  );
}

function Marquee({ children, direction = "left", speed = 20 }: { children: React.ReactNode, direction?: "left" | "right", speed?: number }) {
  return (
    <div className="flex overflow-hidden py-4 [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
      <motion.div
        initial={{ x: direction === "left" ? 0 : "-50%" }}
        animate={{ x: direction === "left" ? "-50%" : 0 }}
        transition={{ duration: speed, repeat: Infinity, ease: "linear" }}
        className="flex gap-6 min-w-max"
      >
        {children}
        {children}
      </motion.div>
    </div>
  )
}

function TestimonialCard({ data }: { data: any }) {
  return (
    <div className="w-[350px] p-6 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 backdrop-blur-md hover:border-white/30 transition-colors">
      <div className="flex gap-1 text-yellow-500 mb-4">
        {[1, 2, 3, 4, 5].map(i => <Star key={i} size={14} fill="currentColor" />)}
      </div>
      <p className="text-gray-300 text-sm mb-6 leading-relaxed">"{data.quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center font-bold text-black text-xs">
          {data.avatar}
        </div>
        <div>
          <div className="text-white font-bold text-sm">{data.author}</div>
          <div className="text-gray-400 text-xs">{data.role}</div>
        </div>
      </div>
    </div>
  )
}

function BackgroundGrid() {
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none active">
      <div
        className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"
      />
    </div>
  );
}
