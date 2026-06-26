import { useState, useEffect } from 'react';
import apiClient from '@api/axios.js';

export default function ComponentTemplate(): React.JSX.Element {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: res } = await apiClient.get('/[endpoint]');
        setData(res.data);
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">[Título]</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
