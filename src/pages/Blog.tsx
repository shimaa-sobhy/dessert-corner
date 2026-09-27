import { useMemo, useState } from 'react';
import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';
import ArticleCard from '../components/ArticleCard';
import { ARTICLES } from '../data/articles';

export default function Blog() {
  const categories = useMemo(() => ['All', ...Array.from(new Set(ARTICLES.map((a) => a.category)))], []);
  const [active, setActive] = useState('All');

  const filtered = active === 'All' ? ARTICLES : ARTICLES.filter((a) => a.category === active);

  return (
    <>
      <PageHero title="The Journal" subtitle="Notes on baking, ingredients, and what happens behind the counter." />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Blog' }]} />
          <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActive(cat)}
                className={`btn btn-sm ${active === cat ? 'btn-primary' : 'btn-ghost'}`}
              >
                {cat}
              </button>
            ))}
          </div>
          <div className="article-grid">
            {filtered.map((a) => (
              <ArticleCard article={a} key={a.slug} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
