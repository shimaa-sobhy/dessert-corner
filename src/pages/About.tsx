import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';
import kitchen from '../assets/kitchen-morning.webp';
import bake from '../assets/our-bakery.webp';
import Button from '../components/Button';

const VALUES = [
  { title: 'Made fresh, always', body: 'Nothing sits longer than a day. What you see in the case was mixed, proofed, and baked that same morning.' },
  { title: 'Real ingredients only', body: 'Real fruit purees, cultured butter, and dark chocolate — never flavoring, never shortcuts.' },
  { title: 'Small batches, high standard', body: 'We would rather sell out by 3pm than compromise on what goes in the case.' },
];

export default function About() {
  return (
    <>
      <PageHero title="About Sucré" subtitle="A small kitchen with a simple rule: if we wouldn't serve it to family, it doesn't leave the counter." />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'About' }]} />

          <div className="about-story-grid">
            <div className="about-img-box">
              <img src={kitchen} alt="A Morning Inside Our Kitchen" className="about-img" width={800} height={600} loading="lazy" />
            </div>
            <div>
              <span className="eyebrow">Our story</span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'clamp(26px,3.2vw,36px)', margin: '10px 0 16px', color: 'var(--ink)' }}>
                Started in a home kitchen, grown one order at a time
              </h2>
              <p style={{ color: 'var(--ink-soft)', lineHeight: 1.85, marginBottom: 14 }}>
                Sucré began in 2019 as a weekend donut stand run out of a home kitchen. What started as a way to
                use up a surplus of butter turned into a full bakery within two years, once word of the caramel
                drizzle donut got around the neighborhood.
              </p>
              <p style={{ color: 'var(--ink-soft)', lineHeight: 1.85 }}>
                Today we run a small production kitchen with a team of six, still baking everything from scratch
                each morning and still refusing to hold anything longer than a day before it reaches the case.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-pink">
        <div className="section-head">
          <span className="eyebrow">What we believe</span>
          <h2>
            The <i>values</i> behind every batch
          </h2>
        </div>
        <div className="about-values-grid">
          {VALUES.map((v) => (
            <div className="surface" key={v.title}>
              <h3 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 18, marginBottom: 10, color: 'var(--ink)' }}>{v.title}</h3>
              <p style={{ color: 'var(--ink-soft)', fontSize: 14, lineHeight: 1.75 }}>{v.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section">
          <div className="about-cta-grid">
            <div>
              <span className="eyebrow">Come find us</span>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'clamp(24px,3vw,32px)', margin: '10px 0 16px', color: 'var(--ink)' }}>
                We'd love to bake for your next occasion
              </h2>
              <p style={{ color: 'var(--ink-soft)', lineHeight: 1.8, marginBottom: 24 }}>
                From weekday cravings to wedding cakes, our kitchen takes on orders of every size. Reach out and
                tell us what you're celebrating.
              </p>
              <Button to="/contact">Get in Touch</Button>
            </div>
            <div className="about-img-box">
              <img src={bake} alt="We'd love to bake for your next occasion" className="about-img" width={800} height={600} loading="lazy" />
            </div>
          </div>
      </section>
    </>
  );
}
