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
              {/* Gen Alpha (Free) */}
              <div className="landing-pricing-card">
                <div className="landing-pricing-header">
                  <span className="landing-tier-badge">{l.tierAlphaBadge}</span>
                  <h3 className="landing-tier-name">{l.tierAlphaName}</h3>
                  <div className="landing-tier-price">
                    <span className="price-num">{l.tierAlphaPrice}</span>
                    <span className="price-period">{l.tierAlphaPeriod}</span>
                  </div>
                  <p className="landing-tier-desc">{l.tierAlphaDesc}</p>
                </div>

                <div className="landing-pricing-features">
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierAlphaF1}</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierAlphaF2}</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierAlphaF3}</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierAlphaF4}</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierAlphaF5}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTier('gen_alpha')}
                  className="btn btn-outline landing-pricing-btn"
                >
                  <span>{l.tierAlphaBtn}</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Gen Beta (Rp 20.000) */}
              <div className="landing-pricing-card">
                <div className="landing-pricing-header">
                  <span className="landing-tier-badge badge-popular">{l.tierBetaBadge}</span>
                  <h3 className="landing-tier-name">{l.tierBetaName}</h3>
                  <div className="landing-tier-price">
                    <span className="price-num">{l.tierBetaPrice}</span>
                    <span className="price-period">{l.tierBetaPeriod}</span>
                  </div>
                  <p className="landing-tier-desc">{l.tierBetaDesc}</p>
                </div>

                <div className="landing-pricing-features">
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span><strong>{l.tierBetaF1}</strong></span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierBetaF2}</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierBetaF3}</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierBetaF4}</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierBetaF5}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTier('gen_beta')}
                  className="btn btn-outline landing-pricing-btn"
                >
                  <span>{l.tierBetaBtn}</span>
                  <ArrowRight size={15} />
                </button>
              </div>

              {/* Gen Gamma (Rp 30.000 - Recommended) */}
              <div className="landing-pricing-card landing-pricing-featured">
                <div className="landing-featured-ribbon">{l.tierGammaRibbon}</div>
                <div className="landing-pricing-header">
                  <span className="landing-tier-badge badge-featured">{l.tierGammaBadge}</span>
                  <h3 className="landing-tier-name">{l.tierGammaName}</h3>
                  <div className="landing-tier-price">
                    <span className="price-num">{l.tierGammaPrice}</span>
                    <span className="price-period">{l.tierGammaPeriod}</span>
                  </div>
                  <p className="landing-tier-desc">{l.tierGammaDesc}</p>
                </div>

                <div className="landing-pricing-features">
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span><strong>{l.tierGammaF1}</strong></span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierGammaF2}</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierGammaF3}</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierGammaF4}</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierGammaF5}</span>
                  </div>
                  <div className="landing-feature-line">
                    <Check size={16} className="text-success" />
                    <span>{l.tierGammaF6}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTier('gen_gamma')}
                  className="btn btn-primary landing-pricing-btn"
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
