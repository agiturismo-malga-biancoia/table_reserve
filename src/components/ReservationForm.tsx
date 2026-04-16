import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Reservation } from '../types/supabase';
import { supabase } from '../lib/supabase';
import { RESTAURANT_ID } from '../lib/constants';

interface ReservationFormProps {
  initialData?: Partial<Reservation>;
  onSubmit: (data: Omit<Reservation, 'id' | 'created_at'>) => Promise<void>;
  onCancel: () => void;
  onDelete?: () => Promise<void>;
  title: string;
  restaurantId: string;
}

export default function ReservationForm({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
  title,
  restaurantId,
}: ReservationFormProps) {
  // Helper function to get today's date in YYYY-MM-DD format in local timezone
  const getTodayDateString = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    customer_name: initialData?.customer_name || '',
    contact_info: initialData?.contact_info || '',
    party_size: initialData?.party_size || 2,
    reservation_date: initialData?.reservation_date || getTodayDateString(),
    reservation_time: initialData?.reservation_time || '12:00',
    notes: initialData?.notes || '',
    status: initialData?.status || 'confirmed',
    created_by: initialData?.created_by || '',
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [existingCustomers, setExistingCustomers] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Fetch existing customer names for suggestions (all customers, not date-specific)
  useEffect(() => {
    const fetchExistingCustomers = async () => {
      try {
        const { data, error } = await supabase
          .from('reservations')
          .select('customer_name')
          .eq('restaurant_id', RESTAURANT_ID);

        if (error) throw error;

        const customerNames = data?.map(r => r.customer_name) || [];
        const uniqueCustomers = [...new Set(customerNames)];
        setExistingCustomers(uniqueCustomers);
      } catch (error) {
        console.error('Error fetching existing customers:', error);
      }
    };

    fetchExistingCustomers();
  }, []);

  // Check if customer name exists on the same date
  const checkCustomerNameOnDate = async (customerName: string, date: string) => {
    try {
      const { data, error } = await supabase
        .from('reservations')
        .select('id')
        .eq('restaurant_id', RESTAURANT_ID)
        .eq('customer_name', customerName.trim())
        .eq('reservation_date', date);

      if (error) throw error;

      // If editing existing reservation, exclude the current reservation from the check
      if (initialData?.id) {
        return data?.some(r => r.id !== initialData.id) || false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking customer name:', error);
      return false;
    }
  };

  const validateForm = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.customer_name.trim()) {
      newErrors.customer_name = 'Il nome del cliente è obbligatorio';
    } else {
      // Check if customer name already exists on the same date
      const existsOnDate = await checkCustomerNameOnDate(formData.customer_name, formData.reservation_date);
      if (existsOnDate) {
        newErrors.customer_name = 'Questo cliente ha già una prenotazione per questa data. Ogni cliente può avere solo una prenotazione per giorno.';
      }
    }

    if (!formData.contact_info.trim()) {
      newErrors.contact_info = 'Le informazioni di contatto sono obbligatorie';
    }
    
    if (!formData.party_size || formData.party_size < 1) {
      newErrors.party_size = 'Il numero di persone deve essere almeno 1';
    }
    
    if (!formData.reservation_date) {
      newErrors.reservation_date = 'La data di prenotazione è obbligatoria';
    }

    if (!formData.reservation_time) {
      newErrors.reservation_time = 'L\'orario di prenotazione è obbligatorio';
    }

    if (!formData.created_by.trim()) {
      newErrors.created_by = 'Il campo "Prenotato da" è obbligatorio';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'party_size' ? parseInt(value, 10) || '' : value,
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Show suggestions for customer name
    if (name === 'customer_name') {
      setShowSuggestions(value.length > 0);
    }

    // Clear customer name error when date changes (since validation is date-specific)
    if (name === 'reservation_date' && errors.customer_name) {
      setErrors(prev => ({ ...prev, customer_name: '' }));
    }
  };

  const handleCustomerNameSelect = (customerName: string) => {
    setFormData(prev => ({ ...prev, customer_name: customerName }));
    setShowSuggestions(false);
    setErrors(prev => ({ ...prev, customer_name: '' }));
  };

  const getFilteredSuggestions = () => {
    if (!formData.customer_name) return [];
    
    return existingCustomers.filter(name => 
      name.toLowerCase().includes(formData.customer_name.toLowerCase()) &&
      name.toLowerCase() !== formData.customer_name.toLowerCase()
    ).slice(0, 5);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await validateForm())) {
      return;
    }
    
    try {
      setLoading(true);
      await onSubmit({
        restaurant_id: restaurantId,
        customer_name: formData.customer_name.trim(),
        contact_info: formData.contact_info.trim(),
        party_size: Number(formData.party_size),
        reservation_date: formData.reservation_date,
        reservation_time: formData.reservation_time,
        notes: formData.notes || null,
        status: formData.status,
        created_by: formData.created_by.trim(),
      });
    } catch (error) {
      console.error('Errore nell\'invio del modulo:', error);
      // Handle specific error for duplicate customer name on same date
      if (error instanceof Error && error.message.includes('duplicate key value violates unique constraint')) {
        setErrors(prev => ({ 
          ...prev, 
          customer_name: 'Questo cliente ha già una prenotazione per questa data. Ogni cliente può avere solo una prenotazione per giorno.' 
        }));
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredSuggestions = getFilteredSuggestions();

  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
          <button
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            aria-label="Chiudi"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label htmlFor="created_by" className="block text-sm font-medium text-gray-700">
              Prenotato da <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="created_by"
              name="created_by"
              value={formData.created_by}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.created_by ? 'border-red-500' : 'border-gray-300'
              } shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
              placeholder="Il tuo nome"
            />
            {errors.created_by && <p className="mt-1 text-sm text-red-500">{errors.created_by}</p>}
          </div>

          <div className="relative">
            <label htmlFor="customer_name" className="block text-sm font-medium text-gray-700">
              Nome Cliente <span className="text-red-500">*</span>
              <span className="text-xs text-gray-500 ml-1">(unico per data)</span>
            </label>
            <input
              type="text"
              id="customer_name"
              name="customer_name"
              value={formData.customer_name}
              onChange={handleChange}
              onFocus={() => setShowSuggestions(formData.customer_name.length > 0)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              className={`mt-1 block w-full rounded-md border ${
                errors.customer_name ? 'border-red-500' : 'border-gray-300'
              } shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
              placeholder="Nome del cliente"
            />
            
            {/* Customer name suggestions */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto">
                <div className="p-2 text-xs text-gray-500 border-b">
                  Clienti esistenti (seleziona per riutilizzare):
                </div>
                {filteredSuggestions.map((customerName, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleCustomerNameSelect(customerName)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 text-sm"
                  >
                    {customerName}
                  </button>
                ))}
              </div>
            )}
            
            {errors.customer_name && <p className="mt-1 text-sm text-red-500">{errors.customer_name}</p>}
            
            {existingCustomers.length > 0 && (
              <p className="mt-1 text-xs text-gray-500">
                Suggerimento: Inizia a digitare per vedere i clienti esistenti. Lo stesso cliente può prenotare in date diverse.
              </p>
            )}
          </div>

          <div>
            <label htmlFor="contact_info" className="block text-sm font-medium text-gray-700">
              Informazioni di Contatto <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="contact_info"
              name="contact_info"
              value={formData.contact_info}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.contact_info ? 'border-red-500' : 'border-gray-300'
              } shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
              placeholder="Telefono o email (obbligatorio)"
            />
            {errors.contact_info && <p className="mt-1 text-sm text-red-500">{errors.contact_info}</p>}
          </div>

          <div>
            <label htmlFor="party_size" className="block text-sm font-medium text-gray-700">
              Numero di Persone <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="party_size"
              name="party_size"
              min="1"
              value={formData.party_size}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.party_size ? 'border-red-500' : 'border-gray-300'
              } shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
            />
            {errors.party_size && <p className="mt-1 text-sm text-red-500">{errors.party_size}</p>}
          </div>

          <div>
            <label htmlFor="reservation_date" className="block text-sm font-medium text-gray-700">
              Data Prenotazione <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="reservation_date"
              name="reservation_date"
              value={formData.reservation_date}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.reservation_date ? 'border-red-500' : 'border-gray-300'
              } shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
            />
            {errors.reservation_date && <p className="mt-1 text-sm text-red-500">{errors.reservation_date}</p>}
          </div>

          <div>
            <label htmlFor="reservation_time" className="block text-sm font-medium text-gray-700">
              Orario Prenotazione <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              id="reservation_time"
              name="reservation_time"
              value={formData.reservation_time}
              onChange={handleChange}
              className={`mt-1 block w-full rounded-md border ${
                errors.reservation_time ? 'border-red-500' : 'border-gray-300'
              } shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50`}
            />
            {errors.reservation_time && <p className="mt-1 text-sm text-red-500">{errors.reservation_time}</p>}
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700">
              Stato
            </label>
            <select
              id="status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
            >
              <option value="confirmed">Confermata</option>
              <option value="cancelled">Annullata</option>
              <option value="completed">Completata</option>
              <option value="no-show">Non Presentato</option>
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Note
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm p-2 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50"
              placeholder="Richieste speciali o informazioni aggiuntive"
            />
          </div>

          <div className="flex justify-between pt-4 space-x-3">
            {onDelete && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                disabled={loading}
              >
                Elimina
              </button>
            )}
            <div className={onDelete ? '' : 'ml-auto'}>
              <button
                type="button"
                onClick={onCancel}
                className="mr-3 inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={loading}
              >
                Annulla
              </button>
              <button
                type="submit"
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                disabled={loading}
              >
                {loading ? 'Salvataggio...' : initialData?.id ? 'Aggiorna' : 'Crea'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}