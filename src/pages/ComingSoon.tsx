import { Link } from 'react-router-dom';

export default function ComingSoon({ title, text, waitlist = true }: { title: string; text: string; waitlist?: boolean }) {
  return (
    <div className="page">
      <h1 className="page-title">{title}</h1>
      <div className="card empty">
        <p className="muted">{text}</p>
        {waitlist && <Link className="btn" to="/waitlist">Join the waitlist</Link>}
      </div>
    </div>
  );
}
