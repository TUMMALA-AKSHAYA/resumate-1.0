import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Shield } from 'lucide-react';
import { BRAND_NAME, BRAND_TAGLINE } from '../brand';

const benefits = [
  'Light, professional workspace designed for clarity',
  'Secure accounts with role-aware dashboards',
  'Resume builder + uploads with “send to builder” workflow',
  'Active/inactive resumes so you control what’s used when applying',
];

export function LandingPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-16 px-1 pb-8 sm:space-y-20">
      <section className="relative overflow-hidden rounded-3xl border border-brand-200/80 bg-gradient-to-br from-white via-surface-tint to-surface-subtle px-5 py-12 shadow-soft sm:px-10 sm:py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="space-y-6"
          >
            <p className="text-sm font-bold uppercase tracking-wide text-brand-700">{BRAND_NAME}</p>
            <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15]">
              Land the role you want with {BRAND_TAGLINE.toLowerCase()}.
            </h1>
            <p className="max-w-xl text-lg leading-relaxed text-ink-secondary">
              Build polished resumes, run AI-assisted analysis, explore curated job listings, and keep recruiters and
              candidates aligned—without the noise.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-5 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/25 transition hover:bg-brand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center rounded-xl border-2 border-surface-line bg-white px-5 py-3 text-sm font-semibold text-ink shadow-sm transition hover:border-brand-200 hover:bg-surface-tint"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="inline-flex items-center rounded-xl px-5 py-3 text-sm font-semibold text-brand-700 underline-offset-4 hover:underline"
              >
                Register
              </Link>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.08 }}
            className="flex justify-center lg:justify-end"
          >
            <img
              src="/landing-hero.png"
              alt="Professional reviewing and rating a resume illustration"
              className="max-h-[min(340px,50vh)] w-full max-w-md object-contain drop-shadow-xl sm:max-h-[380px]"
              loading="eager"
            />
          </motion.div>
        </div>
      </section>

      <section className="rounded-3xl border border-brand-100 bg-gradient-to-r from-surface-tint via-white to-surface-subtle px-5 py-12 shadow-card sm:px-10 sm:py-14">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-14">
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-5"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3 py-1.5 text-xs font-semibold text-brand-800 shadow-sm">
              <Shield className="h-3.5 w-3.5 text-brand-600" aria-hidden />
              Benefits
            </div>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Why teams choose {BRAND_NAME}</h2>
            <ul className="space-y-3.5 text-ink-secondary">
              {benefits.map((b) => (
                <li key={b} className="flex gap-3 text-sm leading-relaxed sm:text-base">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-500" aria-hidden />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 8 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-surface-line bg-white p-6 shadow-soft sm:p-8"
          >
            <p className="text-sm font-semibold text-ink-muted">Ready when you are</p>
            <p className="mt-2 text-xl font-bold text-ink">Create your profile in minutes</p>
            <p className="mt-3 text-sm leading-relaxed text-ink-secondary">
              Join as a candidate to build and tune your resume, or as a recruiter to publish roles and review
              applicants.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link
                to="/register"
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 sm:flex-none"
              >
                Get started
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                to="/login"
                className="inline-flex flex-1 items-center justify-center rounded-xl border-2 border-surface-line bg-surface-subtle px-4 py-3 text-sm font-semibold text-ink transition hover:border-brand-200 hover:bg-white sm:flex-none"
              >
                Login
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
