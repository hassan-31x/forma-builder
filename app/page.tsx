import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronDown,
  Code2,
  Globe,
  Layers,
  Monitor,
  MousePointer2,
  Plus,
  Smartphone,
  Sparkles,
  Type,
} from "lucide-react";
import { Brand, Mark } from "@/components/forma/brand";
import { RevealWords } from "@/components/forma/reveal-words";
const faqs = [
  [
    "What can I build with Forma?",
    "Create single page websites for a business, portfolio, product, or idea. Start from a template or an AI generated draft, then edit every element in the visual studio.",
  ],
  [
    "Do I need to know how to code?",
    "No. Add elements, edit text, adjust styles, and preview your page at desktop, tablet, and mobile sizes. You can also export the finished page as HTML.",
  ],
  [
    "Can I use Forma for free?",
    "You can try the local editor without an account. With an account, you can save projects online and generate up to 10 AI drafts per day. No credit card is required.",
  ],
  [
    "Can I publish my website?",
    "Yes. Publish a saved project to a public Forma link. Your private edits stay in the studio until you publish again. You can remove the public version whenever you like.",
  ],
  [
    "Can I take my website elsewhere?",
    "Yes. Export a standalone HTML file with your page content and styles, and host it wherever you prefer. Your website stays yours.",
  ],
  [
    "Does Forma support stores or multi page sites?",
    "Forma currently focuses on single page websites. You can link to your existing store, booking page, or contact email. Built in checkout and multi page routing are not available yet.",
  ],
];
export default function Home() {
  return (
    <>
      <header className="marketing-nav">
        <div className="wrap nav-inner">
          <Brand />
          <nav aria-label="Main navigation">
            <a href="#studio">Product</a>
            <a href="#workflow">How it works</a>
            <a href="#questions">Questions</a>
          </nav>
          <div className="nav-actions">
            <Link href="/login" className="quiet-link">
              Log in
            </Link>
            <Link href="/login?mode=signup" className="button small">
              Start building <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>
      </header>
      <main id="main">
        <section className="hero wrap">
          <div className="hero-glow" aria-hidden="true" />
          <a href="#studio" className="release-note">
            <span className="status-dot" /> A little idea. A real website.{" "}
            <ArrowRight size={14} />
          </a>
          <h1>
            Your next idea.
            <br />
            <span>A place on the web.</span>
          </h1>
          <p>
            Turn what’s in your head into a website that feels like you.
            <br className="desktop-break" /> Start with AI. Make it yours. Put
            it out there.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/login?mode=signup">
              Build your first site <ArrowRight size={16} />
            </Link>
            <Link href="/dashboard?demo=1" className="text-button">
              Explore the studio <ArrowUpRight size={16} />
            </Link>
          </div>
          <div className="hero-note">
            <Check size={13} /> Free to start <span>·</span> No code required{" "}
            <span>·</span> Yours to export
          </div>
          <Link
            href="/dashboard?demo=1"
            className="studio-preview"
            aria-label="Try the Forma website studio"
          >
            <div className="preview-top">
              <div className="preview-brand">
                <Mark className="mini-mark" />
                <span>Workspace</span>
                <span className="preview-slash">/</span>
                <span>Orbit studio</span>
                <ChevronDown size={12} />
              </div>
              <div className="preview-devices">
                <Monitor size={15} />
                <Smartphone size={14} />
              </div>
              <span className="preview-publish">
                Publish <ArrowUpRight size={12} />
              </span>
            </div>
            <div className="preview-body">
              <aside className="preview-rail">
                <MousePointer2 size={17} />
                <Plus size={17} />
                <Layers size={17} />
                <Type size={17} />
                <div />
                <Sparkles size={17} />
              </aside>
              <aside className="preview-layers">
                <span className="panel-label">
                  Layers <Plus size={12} />
                </span>
                <span>
                  <Layers size={13} /> Page
                </span>
                <span className="layer-child">
                  <span>⌑</span> Navigation
                </span>
                <span className="layer-child selected">
                  <span>⌑</span> Hero section
                </span>
                <span className="layer-grandchild">
                  <Type size={12} /> Heading
                </span>
                <span className="layer-grandchild">
                  <Type size={12} /> Description
                </span>
                <span className="layer-grandchild">
                  <ArrowUpRight size={12} /> Button
                </span>
                <span className="layer-child">
                  <span>⌑</span> Selected work
                </span>
                <span className="layer-child">
                  <span>⌑</span> Footer
                </span>
                <div className="preview-ai">
                  <Sparkles size={14} />
                  <span>Your ideas, a head start.</span>
                </div>
              </aside>
              <div className="preview-canvas">
                <div className="sample-site">
                  <div className="sample-nav">
                    <strong>orbit®</strong>
                    <span>
                      Work &nbsp;&nbsp; Studio &nbsp;&nbsp; Let’s talk ↗
                    </span>
                  </div>
                  <div className="sample-hero">
                    <div className="sample-copy">
                      <span className="sample-eyebrow">
                        INDEPENDENT DESIGN STUDIO
                      </span>
                      <h2>
                        Good things start
                        <br />
                        with a different view.
                      </h2>
                      <p>
                        Thoughtful identities. Considered experiences.
                        <br />A small studio with a wider perspective.
                      </p>
                      <span className="sample-button">
                        Let’s make something <ArrowUpRight size={12} />
                      </span>
                    </div>
                    <div className="orbital-art" aria-hidden="true">
                      <div className="orbital-ring ring-one" />
                      <div className="orbital-ring ring-two" />
                      <div className="orbital-ring ring-three" />
                      <div className="orbital-center" />
                    </div>
                  </div>
                  <div className="sample-bottom">
                    <span>SELECTED WORK, 2026</span>
                    <span>Scroll to explore ↓</span>
                  </div>
                </div>
                <span className="canvas-label">
                  Desktop <span>·</span> 1200 × 800
                </span>
              </div>
              <aside className="preview-properties">
                <span className="panel-label">
                  Design <span>•••</span>
                </span>
                <span className="property-title">Hero section</span>
                <div className="property-group">
                  <span>Layout</span>
                  <div className="property-options">
                    ↔ &nbsp;&nbsp; ↕ &nbsp;&nbsp; ▤ &nbsp;&nbsp; ⊞
                  </div>
                  <div className="property-values">
                    <span>
                      W <b>Fill</b>
                    </span>
                    <span>
                      H <b>Auto</b>
                    </span>
                  </div>
                </div>
                <div className="property-group">
                  <span>Spacing</span>
                  <div className="property-values">
                    <span>
                      ↔ <b>64</b>
                    </span>
                    <span>
                      ↕ <b>96</b>
                    </span>
                  </div>
                </div>
                <div className="property-group">
                  <span>Appearance</span>
                  <span className="color-property">
                    <i /> #111214 <b>100%</b>
                  </span>
                </div>
              </aside>
            </div>
          </Link>
          <div className="under-preview">
            <span>A shorter path from “what if” to “it’s live”.</span>
            <div>
              <span>
                <Sparkles size={14} /> AI assisted
              </span>
              <span>
                <MousePointer2 size={14} /> Visually crafted
              </span>
              <span>
                <Code2 size={14} /> Fully yours
              </span>
            </div>
          </div>
        </section>
        <section id="studio" className="feature-section wrap">
          <div className="section-intro">
            <h2>
              A head start.
              <br />
              Not a creative ceiling.
            </h2>
            <p>
              Let AI handle the blank page. Keep your eye for detail.
              <br />
              Forma gives you the tools to make the final call.
            </p>
          </div>
          <div className="feature-layout">
            <article className="feature-large">
              <div className="prompt-illustration">
                <span>
                  <Sparkles size={16} /> Start with a thought
                </span>
                <p>
                  A website for my independent design studio.
                  <br />
                  Minimal, warm, and a little unexpected.
                </p>
                <div>
                  <span>Describe it. We’ll take it from here.</span>
                  <span className="prompt-arrow">
                    <ArrowRight size={16} />
                  </span>
                </div>
              </div>
              <h3>From a sentence to a starting point.</h3>
              <p>
                Describe your idea and get a complete first draft.
                <br />
                Real text, real structure, ready for your touch.
              </p>
            </article>
            <article className="feature-small">
              <div className="detail-illustration">
                <span className="detail-title">Make it feel like you.</span>
                <div className="selection-outline">
                  <span>Heading</span>Your point of view.
                </div>
                <div className="detail-swatches">
                  <i />
                  <i />
                  <i />
                  <i />
                  <span>↔ 48 &nbsp; Aa</span>
                </div>
                <MousePointer2 className="detail-cursor" size={22} />
              </div>
              <h3>Every detail, in your hands.</h3>
              <p>
                Edit the words. Find your colors. Adjust the layout.
                <br />A visual editor that gets out of your way.
              </p>
            </article>
          </div>
          <div className="feature-foot">
            <div>
              <Monitor size={20} />
              <h3>Looks right. Everywhere.</h3>
              <p>Preview across screen sizes before you publish.</p>
            </div>
            <div>
              <Globe size={20} />
              <h3>Ready for the world.</h3>
              <p>Publish to a shareable link whenever you’re ready.</p>
            </div>
            <div>
              <Code2 size={20} />
              <h3>Your website stays yours.</h3>
              <p>Export clean HTML. Take your work with you.</p>
            </div>
          </div>
        </section>
        <section id="workflow" className="workflow wrap">
          <RevealWords text="Less between your idea and the internet." />
          <div className="workflow-steps">
            {[
              [
                "01",
                "Find your starting point",
                "Pick a template or describe what you have in mind.",
              ],
              [
                "02",
                "Put your name on it",
                "Make the words, colors, and details feel like you.",
              ],
              [
                "03",
                "Send it into the world",
                "Publish a link or export your website. You decide.",
              ],
            ].map(([n, h, p]) => (
              <div key={n}>
                <span>{n}</span>
                <h3>{h}</h3>
                <p>{p}</p>
              </div>
            ))}
          </div>
        </section>
        <section id="questions" className="faq-section wrap">
          <div>
            <span className="subtle-label">A few things to know</span>
            <h2>
              Before you
              <br />
              make your move.
            </h2>
            <p>No mystery. Here’s how Forma works.</p>
          </div>
          <div className="faq-list">
            {faqs.map(([q, a]) => (
              <details key={q}>
                <summary>
                  {q}
                  <Plus size={16} />
                </summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </section>
        <section className="final-cta wrap">
          <div className="cta-glow" aria-hidden="true" />
          <Mark />
          <h2>Give that idea a home.</h2>
          <p>The first draft is just a few words away.</p>
          <Link href="/login?mode=signup" className="button">
            Build your first site <ArrowRight size={16} />
          </Link>
          <span>No credit card. No blank canvas.</span>
        </section>
      </main>
      <footer className="marketing-footer wrap">
        <Brand />
        <span>A little idea. A real website.</span>
        <nav aria-label="Footer">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <span>© {new Date().getFullYear()} Forma</span>
        </nav>
      </footer>
    </>
  );
}
