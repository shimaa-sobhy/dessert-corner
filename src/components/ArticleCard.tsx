import { memo } from 'react';
import { Link } from 'react-router-dom';
import type { Article } from '../lib/types';

function ArticleCard({ article }: { article: Article }) {
  return (
    <Link to={`/blog/${article.slug}`} className="article-card">
      <div className="article-card-media">
        <img src={article.cover} alt={article.title} loading="lazy" width={420} height={420} />
      </div>
      <div className="article-card-cat">{article.category}</div>
      <h3>{article.title}</h3>
      <p>{article.excerpt}</p>
      <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 8 }}>
        {new Date(article.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} · {article.readTime}
      </div>
    </Link>
  );
}

export default memo(ArticleCard);