import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import apiClient from '@api/axios.js';

export default function ListTemplate(): React.JSX.Element {
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadItems = async (p: number) => {
    setLoading(true);
    try {
      const { data: res } = await apiClient.get(`/[endpoint]?page=${p}&limit=10`);
      setItems(res.data);
      setPage(res.pagination.page);
      setTotalPages(res.pagination.totalPages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems(1);
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro?')) return;
    try {
      await apiClient.delete(`/[endpoint]/${id}`);
      loadItems(page);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Error al eliminar');
    }
  };

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">[Título]</h1>
        <Link to="/[crear]" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
          + Nuevo
        </Link>
      </div>

      <div className="bg-white rounded shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">#</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Nombre</th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-sm">{item.id?.slice(0, 8)}</td>
                <td className="px-4 py-3 text-sm">{item.nombre || item.name || '-'}</td>
                <td className="px-4 py-3 text-sm space-x-2">
                  <Link to={`/[endpoint]/${item.id}`} className="text-blue-600 hover:text-blue-800">Ver</Link>
                  <Link to={`/[endpoint]/${item.id}/editar`} className="text-green-600 hover:text-green-800">Editar</Link>
                  <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-800">Eliminar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-4">
          <button onClick={() => loadItems(page - 1)} disabled={page <= 1}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Anterior</button>
          <span className="text-sm text-gray-600">Página {page} de {totalPages}</span>
          <button onClick={() => loadItems(page + 1)} disabled={page >= totalPages}
            className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50">Siguiente</button>
        </div>
      )}
    </div>
  );
}
