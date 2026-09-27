import { Link } from 'react-router-dom';
import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';
import { CATEGORIES } from '../data/categories';
import { PRODUCTS } from '../data/products';

export default function Categories() {
  return (
    <>
      <PageHero title="Categories" subtitle="Six ways to fall down the rabbit hole. Pick a craving and start there." />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Categories' }]} />
        </div>
        <div className="container categories-grid">
          {CATEGORIES.map((cat) => {
            const count = PRODUCTS.filter((p) => p.categorySlug === cat.slug).length;
            return (
              <Link to={`/shop?category=${cat.slug}`} key={cat.slug} className="product-card" style={{ textAlign: 'center' }}>
                <div className="product-card-media" style={{ background: 'var(--pink-soft)' }}>
                  <img src={cat.image} alt={cat.name} width={200} height={200} style={{ objectFit: 'contain', padding: 30 }} />
                </div>
                <h3 className="product-card-name" style={{ fontSize: 20 }}>
                  {cat.name}
                </h3>
                <p style={{ color: 'var(--ink-soft)', fontSize: 13.5, lineHeight: 1.6, marginBottom: 10 }}>{cat.description}</p>
                <span className="badge badge-best">{count} items</span>
              </Link>
            );
          })}
        </div>
      </section>
    </>
  );
}
