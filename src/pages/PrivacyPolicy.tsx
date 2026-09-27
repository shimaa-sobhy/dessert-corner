import PageHero from '../components/PageHero';
import Breadcrumbs from '../components/Breadcrumbs';

export default function PrivacyPolicy() {
  return (
    <>
      <PageHero title="Privacy Policy" subtitle="Last updated June 2026" />
      <section className="section" style={{ paddingTop: 48 }}>
        <div className="container">
          <Breadcrumbs items={[{ label: 'Privacy Policy' }]} />
          <div className="prose-content">
            <p>
              This Privacy Policy describes how Sucré Confectionery ("we", "us") collects, uses, and protects
              information you provide when you use this website and place an order with us.
            </p>
            <h2>Information We Collect</h2>
            <p>
              When you create an account, place an order, or contact us, we collect information such as your
              name, email address, phone number, delivery address, and order history. Payment details entered at
              checkout are processed for the purpose of completing your order and are not stored on our servers
              in this demo environment.
            </p>
            <h2>How We Use Your Information</h2>
            <ul>
              <li>To process and deliver your orders</li>
              <li>To send order confirmations and delivery updates</li>
              <li>To respond to inquiries submitted through our Contact page</li>
              <li>To send occasional newsletter emails, if you have opted in</li>
              <li>To improve our website and product offering</li>
            </ul>
            <h2>Data Storage</h2>
            <p>
              Account details, saved addresses, and order history entered on this site are stored locally in
              your browser for the purposes of this demonstration and are not transmitted to an external server
              or shared with third parties.
            </p>
            <h2>Cookies</h2>
            <p>
              We use minimal local storage to remember your cart, wishlist, and session — no third-party
              advertising or tracking cookies are used on this site.
            </p>
            <h2>Your Rights</h2>
            <p>
              You may request access to, correction of, or deletion of your personal information at any time by
              contacting us through the Contact page. You can also clear your locally stored data at any time by
              clearing your browser's site data for this domain.
            </p>
            <h2>Contact Us</h2>
            <p>If you have questions about this policy, reach out at hello@sucre.bakery.</p>
          </div>
        </div>
      </section>
    </>
  );
}
