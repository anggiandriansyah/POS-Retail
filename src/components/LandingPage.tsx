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
} from 'lucide-react';
import AlphosLogo from './AlphosLogo';
import ThemeLangToggles from './ThemeLangToggles';
import RegistrationModal from './RegistrationModal';
import type { PackageTier } from '../utils/subscriptionStorage';
import { useThemeLang } from '../contexts/useThemeLang';

function DeviceGraphic({ type }: { type: 'alpha' | 'beta' | 'gamma' }) {
  if (type === 'alpha') {
    return (
      <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="13" y="4" width="22" height="40" rx="5" stroke="currentColor" strokeWidth="2.4" fill="none" />
        <line x1="20" y1="8" x2="28" y2="8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
        <rect x="17" y="12" width="14" height="20" rx="2" fill="currentColor" fillOpacity="0.16" />
        <path d="M20 16V28M23 16V28M25.5 16V28M28 16V28" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="24" cy="38.5" r="1.4" fill="currentColor" />
      </svg>
    );
  }
  if (type === 'beta') {
    return (
      <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="6" y="8" width="36" height="25" rx="4" stroke="currentColor" strokeWidth="2.4" fill="none" />
        <rect x="10" y="12" width="28" height="17" rx="2" fill="currentColor" fillOpacity="0.16" />
        <path d="M14 17H21M14 21H18M25 17H34M25 21H30" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <path d="M18 33L15 41H33L30 33" stroke="currentColor" strokeWidth="2.4" strokeLinejoin="round" />
        <line x1="12" y1="41" x2="36" y2="41" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="42" height="42" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect x="11" y="4" width="26" height="40" rx="5" stroke="currentColor" strokeWidth="2.4" fill="none" />
      <rect x="15" y="8" width="18" height="15" rx="2" fill="currentColor" fillOpacity="0.18" />
      <path d="M18 14H25M18 18H22" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="16" y="27" width="3.5" height="2.5" rx="0.8" fill="currentColor" />
      <rect x="22.25" y="27" width="3.5" height="2.5" rx="0.8" fill="currentColor" />
      <rect x="28.5" y="27" width="3.5" height="2.5" rx="0.8" fill="currentColor" />
      <rect x="16" y="32" width="3.5" height="2.5" rx="0.8" fill="currentColor" />
      <rect x="22.25" y="32" width="3.5" height="2.5" rx="0.8" fill="currentColor" />
      <rect x="28.5" y="32" width="3.5" height="2.5" rx="0.8" fill="currentColor" />
      <path d="M17 38.5H31" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
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

        {/* Pricing Packages Section */}
        <section id="paket" className="landing-section landing-section-alt">
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
                  <div className="landing-shield-badge shield-emerald">
                    <span>{l.shieldPerintis.split('\n')[0]}</span>
                    <span>{l.shieldPerintis.split('\n')[1]}</span>
                  </div>
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
                  <div className="landing-shield-badge shield-blue">
                    <span>{l.shieldBeta.split('\n')[0]}</span>
                    <span>{l.shieldBeta.split('\n')[1]}</span>
                  </div>
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
                  <div className="landing-shield-badge shield-featured">
                    <span>{l.shieldGamma.split('\n')[0]}</span>
                    <span>{l.shieldGamma.split('\n')[1]}</span>
                  </div>
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
    </div>
  );
}
