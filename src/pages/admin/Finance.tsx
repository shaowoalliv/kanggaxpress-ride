import { Helmet } from 'react-helmet';

export default function AdminFinance() {
  return (
    <>
      <Helmet>
        <title>Finance - Admin - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="p-6">
        <h2 className="text-3xl font-bold font-heading mb-2">Finance</h2>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </>
  );
}
