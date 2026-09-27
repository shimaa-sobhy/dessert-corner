import { Navigate, useParams } from 'react-router-dom';
import Breadcrumbs from '../components/Breadcrumbs';
import ArticleCard from '../components/ArticleCard';
import { getArticle, getRelatedArticles } from '../data/articles';

export default function ArticleDetails() {
  const { slug } = useParams<{ slug: string }>();
  const article = slug ? getArticle(slug) : undefined;

  if (!article) return <Navigate to="/blog" replace />;

  const related = getRelatedArticles(article);

  return (
    <section className="section" style={{ paddingTop: 40 }}>
      <div className="container">
        <Breadcrumbs items={[{ label: 'Blog', to: '/blog' }, { label: article.title }]} />

        <div style={{ maxWidth: 760, margin: '0 auto 40px', textAlign: 'center' }}>
          <span className="eyebrow">{article.category}</span>
          <h1 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 'clamp(28px,3.6vw,44px)', margin: '10px 0', color: 'var(--ink)' }}>
            {article.title}
          </h1>
          <p style={{ color: 'var(--ink-soft)', fontSize: 13 }}>
            By {article.author} ·{' '}
            {new Date(article.date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })} · {article.readTime}
          </p>
        </div>

        <div className="surface" style={{ padding: 0, overflow: 'hidden', maxWidth: 900, margin: '0 auto 40px', aspectRatio: '16/8' }}>
          <img src={article.cover} alt={article.title} width={900} height={600} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        <div className="prose-content">
          {article.content.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </div>

        {related.length > 0 ? (
          <div className="container" style={{ maxWidth: 1180, margin: '80px auto 0' }}>
            <h2 style={{ fontFamily: 'Fraunces, serif', fontWeight: 600, fontSize: 24, marginBottom: 24, color: 'var(--ink)' }}>
              You might also enjoy
            </h2>
            <div className="article-grid">
              {related.map((a) => (
                <ArticleCard article={a} key={a.slug} />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
