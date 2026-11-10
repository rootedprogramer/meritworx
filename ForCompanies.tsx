import Waitlist from './Waitlist';

export default function ForCompanies() {
  return (
    <div className="page">
      <h1 className="page-title">Get paid without chasing invoices</h1>
      <p className="lead">MeritWorx is an invitation-only list of Birmingham’s most trusted trade companies. Homeowners find you, request quotes, and pay from their phone.</p>

      <section className="card section">
        <h2 className="h2">What you get</h2>
        <ul className="plain-list">
          <li><strong>Card on file before the job.</strong> Homeowners save a card when they accept your quote.</li>
          <li><strong>Pay at the door.</strong> Send the bill from your phone when the work is done.</li>
          <li><strong>Automatic reminders.</strong> Unpaid bills get reminded for you, then charged after the window.</li>
          <li><strong>Deposits on big jobs.</strong> Collect 25% to 50% when the homeowner accepts.</li>
          <li><strong>A level you earn.</strong> Verified reviews from paid jobs move you up. No one can buy a higher spot.</li>
        </ul>
      </section>

      <section className="card section">
        <h2 className="h2">Pricing</h2>
        <p><strong>Free while we launch.</strong> Get listed and set up at no charge until in-app payments go live.</p>
        <div className="price-rows">
          <div><span>App listing, first 6 months</span><strong>$100/mo by bank · $104 by card</strong></div>
          <div><span>App listing, yearly</span><strong>$1,000/yr</strong></div>
          <div><span>Editor’s Guide Half or Full Page advertisers</span><strong>Listing included</strong></div>
        </div>
        <p className="muted small">The app takes no cut of your jobs. Standard card processing comes out of each payout, the same as any card reader.</p>
      </section>

      <h2 className="h2">Ask for an invitation</h2>
      <Waitlist kind="company" />
    </div>
  );
}
