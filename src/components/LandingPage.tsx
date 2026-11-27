'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  ShoppingBag,
  Zap,
  WifiOff,
  ShieldCheck,
  TrendingUp,
  Boxes,
  Check,
  ArrowRight,
  Sparkles,
  Store,
  HelpCircle,
  FileCheck2,
  Lock,
  Coffee,
  Layers,
  Smartphone,
  Laptop,
  Printer,
  ScanBarcode,
} from 'lucide-react';
import AlphosLogo from './AlphosLogo';
import ThemeLangToggles from './ThemeLangToggles';
import RegistrationModal from './RegistrationModal';
import type { PackageTier } from '../utils/subscriptionStorage';
import { useThemeLang } from '../contexts/useThemeLang';

function ShieldBadge({
  variant,
  topText,
  bottomText,
}: {
  variant: 'emerald' | 'blue' | 'red';
  topText: string;
  bottomText: string;
}) {
  return (
    <div className={`landing-shield-wrapper shield-wrapper-${variant}`}>
      <svg
        className="landing-shield-svg"
        viewBox="0 0 84 88"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="shieldGradRed" x1="0" y1="0" x2="84" y2="88" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#EF4444" />
            <stop offset="100%" stopColor="#DC2626" />
          </linearGradient>
          <filter id="shieldDropRed" x="-10%" y="-10%" width="130%" height="135%">
            <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="rgba(220, 38, 38, 0.4)" />
          </filter>
        </defs>

        {variant === 'red' ? (
          <path
            d="M 12 4 H 72 C 78 4 82 8 82 14 V 42 C 82 66 45 84 42 85 C 39 84 2 66 2 42 V 14 C 2 8 6 4 12 4 Z"
            fill="url(#shieldGradRed)"
            filter="url(#shieldDropRed)"
          />
        ) : variant === 'emerald' ? (
          <path
            d="M 12 4 H 72 C 78 4 82 8 82 14 V 42 C 82 66 45 84 42 85 C 39 84 2 66 2 42 V 14 C 2 8 6 4 12 4 Z"
            fill="var(--surface)"
            stroke="var(--price-emerald)"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        ) : (
          <path
            d="M 12 4 H 72 C 78 4 82 8 82 14 V 42 C 82 66 45 84 42 85 C 39 84 2 66 2 42 V 14 C 2 8 6 4 12 4 Z"
            fill="var(--surface)"
            stroke="var(--price-blue)"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
        )}
      </svg>

      <div className="landing-shield-content">
        <span className="shield-top-text">{topText}</span>
        <span className="shield-bottom-text">{bottomText}</span>
      </div>
    </div>
  );
}

function DeviceGraphic({ type }: { type: 'alpha' | 'beta' | 'gamma' }) {
  if (type === 'alpha') {
    return (
      <svg width="48" height="48" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="15" y="4" width="26" height="48" rx="6" fill="var(--surface)" stroke="var(--price-emerald)" strokeWidth="2.4" />
        <rect x="18" y="10" width="20" height="34" rx="3" fill="var(--price-emerald-soft)" />
        <line x1="21" y1="7" x2="35" y2="7" stroke="var(--price-emerald)" strokeWidth="2" strokeLinecap="round" />
        <rect x="20" y="13" width="16" height="3" rx="1.5" fill="var(--price-emerald)" />
        <rect x="20" y="18" width="12" height="2" rx="1" fill="var(--price-emerald)" fillOpacity="0.6" />
        <rect x="20" y="22" width="16" height="2" rx="1" fill="var(--price-emerald)" fillOpacity="0.4" />
        <rect x="20" y="26" width="10" height="2" rx="1" fill="var(--price-emerald)" fillOpacity="0.4" />
        <line x1="16" y1="33" x2="40" y2="33" stroke="var(--price-emerald)" strokeWidth="1.8" strokeDasharray="2 1" />
        <line x1="22" y1="36" x2="22" y2="41" stroke="var(--price-emerald)" strokeWidth="1.5" strokeLinecap="round" />
        <line x1="25" y1="36" x2="25" y2="41" stroke="var(--price-emerald)" strokeWidth="2" strokeLinecap="round" />
        <line x1="29" y1="36" x2="29" y2="41" stroke="var(--price-emerald)" strokeWidth="1.2" strokeLinecap="round" />
        <line x1="33" y1="36" x2="33" y2="41" stroke="var(--price-emerald)" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="28" cy="48" r="1.5" fill="var(--price-emerald)" />
      </svg>
    );
  }
  if (type === 'beta') {
    return (
      <svg width="48" height="48" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <path d="M14 50H42" stroke="var(--price-blue)" strokeWidth="2.8" strokeLinecap="round" />
        <path d="M22 39L19 49H37L34 39" stroke="var(--price-blue)" strokeWidth="2.4" strokeLinejoin="round" fill="var(--price-blue-soft)" />
        <rect x="6" y="8" width="44" height="31" rx="5" fill="var(--surface)" stroke="var(--price-blue)" strokeWidth="2.4" />
        <rect x="10" y="12" width="36" height="23" rx="3" fill="var(--price-blue-soft)" />
        <rect x="13" y="15" width="18" height="3" rx="1.5" fill="var(--price-blue)" />
        <rect x="13" y="20" width="13" height="2" rx="1" fill="var(--price-blue)" fillOpacity="0.6" />
        <rect x="13" y="24" width="16" height="2" rx="1" fill="var(--price-blue)" fillOpacity="0.4" />
        <rect x="13" y="28" width="10" height="2" rx="1" fill="var(--price-blue)" fillOpacity="0.4" />
        <rect x="33" y="15" width="10" height="15" rx="2" fill="var(--surface)" stroke="var(--price-blue)" strokeWidth="1.2" />
        <line x1="35" y1="18" x2="41" y2="18" stroke="var(--price-blue)" strokeWidth="1.2" />
        <circle cx="36" cy="22" r="1" fill="var(--price-blue)" />
        <circle cx="40" cy="22" r="1" fill="var(--price-blue)" />
        <circle cx="36" cy="26" r="1" fill="var(--price-blue)" />
        <circle cx="40" cy="26" r="1" fill="var(--price-blue)" />
      </svg>
    );
  }
  return (
    <svg width="48" height="48" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M20 10V3H36V10" fill="var(--surface)" stroke="var(--price-red)" strokeWidth="1.8" strokeLinejoin="round" />
      <line x1="23" y1="5.5" x2="33" y2="5.5" stroke="var(--price-red)" strokeWidth="1.2" strokeDasharray="1.5 1" />
      <line x1="23" y1="8" x2="31" y2="8" stroke="var(--price-red)" strokeWidth="1.2" strokeDasharray="1.5 1" />
      <rect x="12" y="8" width="32" height="44" rx="6" fill="var(--surface)" stroke="var(--price-red)" strokeWidth="2.4" />
      <rect x="16" y="12" width="24" height="18" rx="3" fill="var(--price-red-soft)" />
      <rect x="19" y="15" width="14" height="3" rx="1.5" fill="var(--price-red)" />
      <rect x="19" y="20" width="18" height="2" rx="1" fill="var(--price-red)" fillOpacity="0.6" />
      <rect x="19" y="24" width="11" height="2" rx="1" fill="var(--price-red)" fillOpacity="0.4" />
      <path d="M34 16C36 17.5 36 20.5 34 22" stroke="var(--price-red)" strokeWidth="1.4" strokeLinecap="round" />
      <rect x="17" y="33" width="5" height="3.5" rx="1" fill="var(--price-red)" fillOpacity="0.8" />
      <rect x="25.5" y="33" width="5" height="3.5" rx="1" fill="var(--price-red)" fillOpacity="0.8" />
      <rect x="34" y="33" width="5" height="3.5" rx="1" fill="var(--price-red)" fillOpacity="0.8" />
      <rect x="17" y="39" width="5" height="3.5" rx="1" fill="var(--price-red)" fillOpacity="0.8" />
      <rect x="25.5" y="39" width="5" height="3.5" rx="1" fill="var(--price-red)" fillOpacity="0.8" />
      <rect x="34" y="39" width="5" height="3.5" rx="1" fill="var(--price-red)" fillOpacity="0.8" />
      <line x1="20" y1="47" x2="36" y2="47" stroke="var(--price-red)" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export default function LandingPage() {
  const { theme, dict, lang } = useThemeLang();
  const l = dict.landing;
  const [selectedTier, setSelectedTier] = useState<PackageTier | null>(null);

  // Typewriter effect state
  const operationalValues = useMemo(() => [
    l.typewriter1,
    l.typewriter2,
    l.typewriter3,
    l.typewriter4,
    l.typewriter5,
  ], [l.typewriter1, l.typewriter2, l.typewriter3, l.typewriter4, l.typewriter5]);

  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);
  const [currentText, setCurrentText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    setCurrentText('');
    setCurrentPhraseIndex(0);
    setIsDeleting(false);
  }, [lang]);

  useEffect(() => {
    const fullText = operationalValues[currentPhraseIndex] || operationalValues[0];
    const typingSpeed = isDeleting ? 30 : 60;

    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < fullText.length) {
          setCurrentText(fullText.slice(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 2200);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(fullText.slice(0, currentText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentPhraseIndex((prev) => (prev + 1) % operationalValues.length);
        }
      }
    }, typingSpeed);

    return () => clearTimeout(timer);
  }, [currentText, isDeleting, currentPhraseIndex, operationalValues]);

  return (
    <div className="landing-wrapper">
      {/* JSON-LD Schema for SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'ALPHOS Smart Retail POS',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web, Progressive Web App (PWA)',
            offers: [
              {
                '@type': 'Offer',
                price: '0',
                priceCurrency: 'IDR',
                name: 'Gen Alpha (Free)',
              },
              {
                '@type': 'Offer',
                price: '20000',
                priceCurrency: 'IDR',
                name: 'Gen Beta',
              },
              {
                '@type': 'Offer',
                price: '30000',
                priceCurrency: 'IDR',
                name: 'Gen Gamma',
              },
            ],
            creator: {
              '@type': 'Organization',
              name: 'PT AlphaGen',
              url: 'https://alphagen.co.id',
            },
          }),
        }}
      />

      {/* Navigation Header */}
      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <div className="landing-brand">
            <AlphosLogo variant={theme === 'dark' ? 'horizontal' : 'light'} width={150} height={36} />
          </div>

          <nav className="landing-nav" aria-label="Navigasi Halaman">
            <a href="#fitur" className="landing-nav-link">{l.navFeatures}</a>
            <a href="#solusi" className="landing-nav-link">{l.navSolutions}</a>
            <a href="#paket" className="landing-nav-link">{l.navPricing}</a>
            <a href="#keunggulan" className="landing-nav-link">{l.navReliability}</a>
            <a href="#faq" className="landing-nav-link">{l.navFaq}</a>
          </nav>

          <div className="landing-header-actions">
            <ThemeLangToggles compact />
            <Link href="/login" className="btn btn-primary landing-login-btn">
              <span>{l.enterPos}</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="landing-hero-section">
          <div className="landing-container landing-hero-inner">
            <div className="landing-hero-badge">
              <Sparkles size={14} className="landing-sparkle" />
              <span>{l.heroBadge}</span>
            </div>

            <h1 className="landing-hero-title">
              {l.heroPrefix}
              <br />
              <span className="landing-typewriter-text">
                {currentText}
                <span className="landing-cursor" aria-hidden="true">|</span>
              </span>
            </h1>

            <p className="landing-hero-desc">
              {l.heroDesc}
            </p>

            <div className="landing-hero-cta-group">
              <button
                type="button"
                onClick={() => setSelectedTier('gen_alpha')}
                className="btn btn-primary landing-cta-primary"
              >
                <span>{l.ctaPrimary}</span>
                <ArrowRight size={16} />
              </button>
              <a href="#paket" className="btn btn-outline landing-cta-secondary">
                <span>{l.ctaSecondary}</span>
              </a>
            </div>

            <div className="landing-trust-strip">
              <div className="landing-trust-item">
                <Check size={14} className="text-success" />
                <span>{l.trustNoHidden}</span>
              </div>
              <div className="landing-trust-item">
                <Check size={14} className="text-success" />
                <span>{l.trustOffline}</span>
              </div>
              <div className="landing-trust-item">
                <Check size={14} className="text-success" />
                <span>{l.trustInstant}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid Section */}
        <section id="fitur" className="landing-section">
          <div className="landing-container">
            <div className="landing-section-header">
              <h2 className="landing-section-title">{l.featuresTitle}</h2>
              <p className="landing-section-subtitle">{l.featuresSubtitle}</p>
            </div>

            <div className="landing-feature-grid">
              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrap">
                  <WifiOff size={22} />
                </div>
                <h3>{l.feat1Title}</h3>
                <p>{l.feat1Desc}</p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrap">
                  <Zap size={22} />
                </div>
                <h3>{l.feat2Title}</h3>
                <p>{l.feat2Desc}</p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrap">
                  <TrendingUp size={22} />
                </div>
                <h3>{l.feat3Title}</h3>
                <p>{l.feat3Desc}</p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrap">
                  <Boxes size={22} />
                </div>
                <h3>{l.feat4Title}</h3>
                <p>{l.feat4Desc}</p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrap">
                  <ShieldCheck size={22} />
                </div>
                <h3>{l.feat5Title}</h3>
                <p>{l.feat5Desc}</p>
              </div>

              <div className="landing-feature-card">
                <div className="landing-feature-icon-wrap">
                  <ShoppingBag size={22} />
                </div>
                <h3>{l.feat6Title}</h3>
                <p>{l.feat6Desc}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Business Solutions Section (Moka POS Inspired) */}
        <section id="solusi" className="landing-section landing-section-alt">
          <div className="landing-container">
            <div className="landing-section-header">
              <h2 className="landing-section-title">{l.solutionsTitle}</h2>
              <p className="landing-section-subtitle">{l.solutionsSubtitle}</p>
            </div>

            <div className="landing-solutions-grid">
              {/* Card 1: Retail & Grocery */}
              <div className="landing-solution-card">
                <div className="landing-solution-tag">{l.solRetailTag}</div>
                <div className="landing-solution-icon-box sol-icon-emerald">
                  <Store size={26} />
                </div>
                <h3>{l.solRetailTitle}</h3>
                <p>{l.solRetailDesc}</p>
              </div>

              {/* Card 2: F&B & Coffee Shops */}
              <div className="landing-solution-card">
                <div className="landing-solution-tag">{l.solFnbTag}</div>
                <div className="landing-solution-icon-box sol-icon-blue">
                  <Coffee size={26} />
                </div>
                <h3>{l.solFnbTitle}</h3>
                <p>{l.solFnbDesc}</p>
              </div>

              {/* Card 3: Fashion & Specialty */}
              <div className="landing-solution-card">
                <div className="landing-solution-tag">{l.solFashionTag}</div>
                <div className="landing-solution-icon-box sol-icon-purple">
                  <Layers size={26} />
                </div>
                <h3>{l.solFashionTitle}</h3>
                <p>{l.solFashionDesc}</p>
              </div>

              {/* Card 4: Service Businesses */}
              <div className="landing-solution-card">
                <div className="landing-solution-tag">{l.solServiceTag}</div>
                <div className="landing-solution-icon-box sol-icon-coral">
                  <Sparkles size={26} />
                </div>
                <h3>{l.solServiceTitle}</h3>
                <p>{l.solServiceDesc}</p>
              </div>
            </div>

            {/* Hardware Flexibility Ecosystem Banner (Moka Style) */}
            <div className="landing-hardware-banner">
              <div className="landing-hardware-header">
                <h3>{l.hwTitle}</h3>
                <p>{l.hwSubtitle}</p>
              </div>
              <div className="landing-hardware-badges">
                <div className="landing-hw-badge">
                  <Smartphone size={20} className="hw-icon" />
                  <span>{l.hwDevice1}</span>
                </div>
                <div className="landing-hw-badge">
                  <Laptop size={20} className="hw-icon" />
                  <span>{l.hwDevice2}</span>
                </div>
                <div className="landing-hw-badge">
                  <Printer size={20} className="hw-icon" />
                  <span>{l.hwDevice3}</span>
                </div>
                <div className="landing-hw-badge">
                  <ScanBarcode size={20} className="hw-icon" />
                  <span>{l.hwDevice4}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Packages Section */}
        <section id="paket" className="landing-section">
          <div className="landing-container">
            <div className="landing-section-header">
              <h2 className="landing-section-title">{l.pricingTitle}</h2>
              <p className="landing-section-subtitle">{l.pricingSubtitle}</p>
            </div>

            <div className="landing-pricing-grid">
              {/* Gen Alpha (Free / Rp 0) - ATM Card 1 */}
              <div className="landing-pricing-card">
                <div className="landing-card-top">
                  <div className="landing-device-box device-emerald">
                    <DeviceGraphic type="alpha" />
                  </div>
                  <ShieldBadge
                    variant="emerald"
                    topText={l.shieldPerintis.split('\n')[0]}
                    bottomText={l.shieldPerintis.split('\n')[1]}
                  />
                </div>

                <div className="landing-tier-header">
                  <h3 className="landing-atm-tier-name">{l.tierAlphaName}</h3>
                  <p className="landing-atm-tier-desc">{l.tierAlphaDesc}</p>
                </div>

                <div className="landing-atm-price-box">
                  <span className="landing-atm-start-from">{l.startFrom}</span>
                  <div className="landing-atm-price-row">
                    <span className="landing-atm-currency currency-emerald">Rp</span>
                    <span className="landing-atm-num num-emerald">0</span>
                    <span className="landing-atm-period">{l.tierAlphaPeriod}</span>
                  </div>
                </div>

                <div className="landing-atm-included-label">{l.alreadyIncluded}</div>

                <div className="landing-pricing-features">
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-emerald"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierAlphaF1}</span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-emerald"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierAlphaF2}</span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-emerald"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierAlphaF3}</span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-emerald"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierAlphaF4}</span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-emerald"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierAlphaF5}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTier('gen_alpha')}
                  className="landing-atm-btn btn-atm-emerald"
                >
                  <span>{l.tierAlphaBtn}</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Gen Beta (Rp 20.000) - ATM Card 2 */}
              <div className="landing-pricing-card">
                <div className="landing-card-top">
                  <div className="landing-device-box device-blue">
                    <DeviceGraphic type="beta" />
                  </div>
                  <ShieldBadge
                    variant="blue"
                    topText={l.shieldBeta.split('\n')[0]}
                    bottomText={l.shieldBeta.split('\n')[1]}
                  />
                </div>

                <div className="landing-tier-header">
                  <h3 className="landing-atm-tier-name">{l.tierBetaName}</h3>
                  <p className="landing-atm-tier-desc">{l.tierBetaDesc}</p>
                </div>

                <div className="landing-atm-price-box">
                  <span className="landing-atm-start-from">{l.startFrom}</span>
                  <div className="landing-atm-price-row">
                    <span className="landing-atm-currency currency-blue">Rp</span>
                    <span className="landing-atm-num num-blue">20</span>
                    <span className="landing-atm-cents cents-blue">.000</span>
                    <span className="landing-atm-period">{l.tierBetaPeriod}</span>
                  </div>
                </div>

                <div className="landing-atm-included-label">{l.alreadyIncluded}</div>

                <div className="landing-pricing-features">
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-blue"><Check size={12} strokeWidth={3} /></span>
                    <span><strong>{l.tierBetaF1}</strong></span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-blue"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierBetaF2}</span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-blue"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierBetaF3}</span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-blue"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierBetaF4}</span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-blue"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierBetaF5}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTier('gen_beta')}
                  className="landing-atm-btn btn-atm-blue"
                >
                  <span>{l.tierBetaBtn}</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Gen Gamma (Rp 30.000 - Pop-Out Highlight) - ATM Card 3 */}
              <div className="landing-pricing-card landing-pricing-featured">
                <div className="landing-card-top">
                  <div className="landing-device-box device-red">
                    <DeviceGraphic type="gamma" />
                  </div>
                  <ShieldBadge
                    variant="red"
                    topText={l.shieldGamma.split('\n')[0]}
                    bottomText={l.shieldGamma.split('\n')[1]}
                  />
                </div>

                <div className="landing-tier-header">
                  <h3 className="landing-atm-tier-name">{l.tierGammaName}</h3>
                  <p className="landing-atm-tier-desc">{l.tierGammaDesc}</p>
                </div>

                <div className="landing-atm-price-box">
                  <span className="landing-atm-start-from">{l.startFrom}</span>
                  <div className="landing-atm-price-row">
                    <span className="landing-atm-currency currency-red">Rp</span>
                    <span className="landing-atm-num num-red">30</span>
                    <span className="landing-atm-cents cents-red">.000</span>
                    <span className="landing-atm-period">{l.tierGammaPeriod}</span>
                  </div>
                </div>

                <div className="landing-atm-included-label">{l.alreadyIncluded}</div>

                <div className="landing-pricing-features">
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-red"><Check size={12} strokeWidth={3} /></span>
                    <span><strong>{l.tierGammaF1}</strong></span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-red"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierGammaF2}</span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-red"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierGammaF3}</span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-red"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierGammaF4}</span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-red"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierGammaF5}</span>
                  </div>
                  <div className="landing-atm-feature-line">
                    <span className="landing-atm-bullet bullet-red"><Check size={12} strokeWidth={3} /></span>
                    <span>{l.tierGammaF6}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTier('gen_gamma')}
                  className="landing-atm-btn btn-atm-red"
                >
                  <span>{l.tierGammaBtn}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Reliability & Security Section */}
        <section id="keunggulan" className="landing-section">
          <div className="landing-container">
            <div className="landing-reliability-card">
              <div className="landing-reliability-text">
                <h2 className="landing-section-title">{l.relTitle}</h2>
                <div className="landing-reliability-list">
                  <div className="landing-rel-item">
                    <Lock size={18} className="text-primary" />
                    <div>
                      <strong>{l.relItem1Title}</strong>
                      <p>{l.relItem1Desc}</p>
                    </div>
                  </div>
                  <div className="landing-rel-item">
                    <Store size={18} className="text-primary" />
                    <div>
                      <strong>{l.relItem2Title}</strong>
                      <p>{l.relItem2Desc}</p>
                    </div>
                  </div>
                  <div className="landing-rel-item">
                    <FileCheck2 size={18} className="text-primary" />
                    <div>
                      <strong>{l.relItem3Title}</strong>
                      <p>{l.relItem3Desc}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="landing-section landing-section-alt">
          <div className="landing-container">
            <div className="landing-section-header">
              <h2 className="landing-section-title">{l.faqTitle}</h2>
              <p className="landing-section-subtitle">{l.faqSubtitle}</p>
            </div>

            <div className="landing-faq-grid">
              <div className="landing-faq-card">
                <h4>{l.faqQ1}</h4>
                <p>{l.faqA1}</p>
              </div>

              <div className="landing-faq-card">
                <h4>{l.faqQ2}</h4>
                <p>{l.faqA2}</p>
              </div>

              <div className="landing-faq-card">
                <h4>{l.faqQ3}</h4>
                <p>{l.faqA3}</p>
              </div>

              <div className="landing-faq-card">
                <h4>{l.faqQ4}</h4>
                <p>{l.faqA4}</p>
              </div>

              <div className="landing-faq-card">
                <h4>{l.faqQ5}</h4>
                <p>{l.faqA5}</p>
              </div>

              <div className="landing-faq-card">
                <h4>{l.faqQ6}</h4>
                <p>{l.faqA6}</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <div className="landing-footer-brand">
            <AlphosLogo variant="light" width={140} height={34} />
            <p className="landing-footer-tagline">{l.footerTagline}</p>
            <p className="landing-footer-corp">
              Dikelola oleh <strong>PT AlphaGen Info</strong> (<a href="mailto:no-reply@alphagen.co.id">no-reply@alphagen.co.id</a>)
            </p>
          </div>

          <div className="landing-footer-links">
            <div className="landing-footer-col">
              <h5>{l.footerNavTitle}</h5>
              <a href="#fitur">{l.navFeatures}</a>
              <a href="#paket">{l.navPricing}</a>
              <a href="#faq">{l.navFaq}</a>
              <Link href="/login">{l.enterPos}</Link>
            </div>

            <div className="landing-footer-col">
              <h5>{l.footerEcoTitle}</h5>
              <Link href="/login">{l.footerEcoPos}</Link>
              <a href="/monitor.html" target="_blank" rel="noopener noreferrer">{l.footerEcoMonitor}</a>
              <Link href="/login">{l.footerEcoAdmin}</Link>
            </div>
          </div>
        </div>

        <div className="landing-footer-bottom">
          <div className="landing-container landing-footer-bottom-inner">
            <span>&copy; {new Date().getFullYear()} {l.footerRights}</span>
            <span>{l.footerVersion}</span>
          </div>
        </div>
      </footer>

      {/* Registration & Payment Modal */}
      {selectedTier && (
        <RegistrationModal
          initialTier={selectedTier}
          onClose={() => setSelectedTier(null)}
          onSuccess={() => {
            // Keep open to show email instructions or close
          }}
        />
      )}

      {/* Floating WhatsApp Support Widget */}
      <a
        href="https://wa.me/6281280004276"
        target="_blank"
        rel="noopener noreferrer"
        className="landing-wa-float"
        aria-label={`${l.waTitle} - ${l.waSubtitle} (WhatsApp: 6281280004276)`}
      >
        <div className="landing-wa-icon-wrap">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.507 14.307l-.009.075c-.242.667-.84 1.15-1.536 1.282-.547.103-1.144.02-1.737-.123-1.341-.322-2.883-1.265-4.095-2.477-1.212-1.212-2.155-2.754-2.477-4.095-.143-.593-.226-1.19-.123-1.737.132-.696.615-1.294 1.282-1.536.216-.078.448-.118.683-.118.156 0 .313.018.467.054.341.08.625.308.746.626l.872 2.274c.108.281.066.598-.112.839l-.865 1.167c.383.743.957 1.393 1.666 1.895l1.242-.731c.256-.151.575-.164.843-.035l2.252 1.084c.321.154.521.467.521.823 0 .193-.05.385-.148.562zm4.493-2.307c0-5.514-4.486-10-10-10s-10 4.486-10 10c0 1.838.504 3.562 1.385 5.042l-1.385 4.958 5.127-1.345c1.428.808 3.076 1.345 4.873 1.345 5.514 0 10-4.486 10-10zm-2 0c0 4.411-3.589 8-8 8-1.503 0-2.909-.422-4.116-1.151l-.317-.191-2.923.767.781-2.795-.21-.334c-.799-1.269-1.215-2.71-1.215-4.296 0-4.411 3.589-8 8-8s8 3.589 8 8z" />
          </svg>
        </div>
        <div className="landing-wa-text-box">
          <span className="landing-wa-title">{l.waTitle}</span>
          <span className="landing-wa-subtitle">{l.waSubtitle}</span>
        </div>
      </a>
    </div>
  );
}
