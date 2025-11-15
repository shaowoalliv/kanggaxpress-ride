import { Helmet } from 'react-helmet';

const placeholders = [
  { title: 'Trips', file: 'Trips.tsx' },
  { title: 'Deliveries', file: 'Deliveries.tsx' },
  { title: 'KYC', file: 'KYC.tsx' },
  { title: 'Finance', file: 'Finance.tsx' },
  { title: 'Fare Matrix', file: 'FareMatrix.tsx' },
  { title: 'Promotions', file: 'Promotions.tsx' },
  { title: 'Ops', file: 'Ops.tsx' },
  { title: 'Disputes', file: 'Disputes.tsx' },
  { title: 'Audit', file: 'Audit.tsx' },
  { title: 'Settings', file: 'Settings.tsx' },
];

placeholders.forEach(({ title, file }) => {
  const Component = () => (
    <>
      <Helmet>
        <title>{title} - Admin - KanggaXpress</title>
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>
      <div className="p-6">
        <h2 className="text-3xl font-bold font-heading mb-2">{title}</h2>
        <p className="text-muted-foreground">Coming soon</p>
      </div>
    </>
  );
  Component.displayName = `Admin${file.replace('.tsx', '')}`;
  module.exports[`default`] = Component;
});

// Trips
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
