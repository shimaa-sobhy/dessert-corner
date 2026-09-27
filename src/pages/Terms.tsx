import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';

export default function Terms() {
  return (
    <>
      <PageHero title="Terms of Service" subtitle="Last updated June 2026" />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Terms of Service' }]} />
          <div className="prose-content">
            <p>
              These Terms of Service govern your use of the Sucré Confectionery website and any orders placed
              through it. By using this site, you agree to the terms outlined below.
            </p>
            <h2>Orders</h2>
            <p>
              All orders are subject to availability. We reserve the right to limit quantities, decline an order,
              or adjust listed prices in the case of a pricing error. Order confirmation does not guarantee that
              an item will not sell out before preparation begins for high-demand dates.
            </p>
            <h2>Delivery</h2>
            <p>
              Delivery windows are estimates and may vary due to weather, traffic, or order volume, particularly
              around holidays. We are not responsible for delays caused by an incorrect address provided at
              checkout.
            </p>
            <h2>Cancellations &amp; Refunds</h2>
            <p>
              Orders may be cancelled or amended up to 12 hours before the scheduled delivery or pickup time.
              Refunds for damaged or incorrect orders are issued at our discretion following a report made within
              24 hours of delivery, as outlined on our FAQ page.
            </p>
            <h2>Allergens</h2>
            <p>
              Our kitchen handles wheat, dairy, egg, and tree nuts. While we take care in preparation, we cannot
              guarantee any product is completely free of trace allergens.
            </p>
            <h2>Intellectual Property</h2>
            <p>
              All content on this site, including photography, recipes, and text, is the property of Sucré
              Confectionery and may not be reproduced without written permission.
            </p>
            <h2>Changes to These Terms</h2>
            <p>We may update these terms from time to time. Continued use of the site after changes are posted constitutes acceptance of the revised terms.</p>
          </div>
        </div>
      </section>
    </>
  );
}
