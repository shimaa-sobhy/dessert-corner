import { useMemo, useState } from 'react';
import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';
import { FAQS } from '../data/faq';

export default function FAQ() {
  const groups = useMemo(() => Array.from(new Set(FAQS.map((f) => f.group))), []);
  const [openIndex, setOpenIndex] = useState<string | null>(null);

  return (
    <>
      <PageHero title="Frequently Asked Questions" subtitle="Everything you might want to know before you order." />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container" style={{ maxWidth: 760 }}>
          <Breadcrumbs items={[{ label: 'FAQ' }]} />
          {groups.map((group) => (
            <div key={group} style={{ marginBottom: 44 }}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 20, marginBottom: 6, color: 'var(--ink)' }}>{group}</h2>
              <div>
                {FAQS.filter((f) => f.group === group).map((f) => {
                  const key = `${group}-${f.question}`;
                  const isOpen = openIndex === key;
                  return (
                    <div className="accordion-item" key={key}>
                      <button type="button" className="accordion-trigger" onClick={() => setOpenIndex(isOpen ? null : key)}>
                        {f.question}
                        <span style={{ color: 'var(--accent-deep)', fontSize: 18 }}>{isOpen ? '−' : '+'}</span>
                      </button>
                      <div className={`accordion-panel${isOpen ? ' open' : ''}`}>
                        <div className="accordion-panel-inner">{f.answer}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
