// src/components/pages/Dashboard.tsx

const Dashboard: React.FC = () => {
  const { lang } = useLanguage();
  // si quieres usar textos según idioma más adelante, lo mantienes,
  // pero de momento todo el foco es el widget de dominios

  return (
    <div className="min-h-full bg-slate-950">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <DashboardDomainsWidget />
      </div>
    </div>
  );
};

export default Dashboard;
