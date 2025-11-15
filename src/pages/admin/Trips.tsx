import { Helmet } from 'react-helmet';

export default function AdminTrips() {
  return (
    <>
      <Helmet>
        <title>Trips - Admin - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="p-6">
        <h2 className="text-3xl font-bold font-heading mb-2">Trips</h2>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </>
  );
}
