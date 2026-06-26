import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '@api/axios.js';

export default function FormTemplate(): React.JSX.Element {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItem = useCallback(async () => {
    setFetchLoading(true);
    try {
      const { data: res } = await apiClient.get(`/[endpoint]/${id}`);
      setFormData(res.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar datos');
    } finally {
      setFetchLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (isEditing) loadItem();
  }, [isEditing, loadItem]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (isEditing) {
        await apiClient.patch(`/[endpoint]/${id}`, formData);
      } else {
        await apiClient.post('/[endpoint]', formData);
      }
      navigate('/[endpoint]');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  };

  if (fetchLoading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div className="container mx-auto p-4 max-w-lg">
      <h1 className="text-2xl font-bold mb-4">
        {isEditing ? 'Editar' : 'Crear'} [Título]
      </h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded shadow p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
          <input
            type="text"
            name="nombre"
            value={formData.nombre || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
          <textarea
            name="descripcion"
            value={formData.descripcion || ''}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            rows={3}
          />
        </div>

        <div className="flex gap-4 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/[endpoint]')}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
          >
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
