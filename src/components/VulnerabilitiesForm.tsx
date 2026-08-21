import React from 'react';
import { HouseholdVulnerabilities, ChildNeed, SeniorNeed, DisabilityNeed, PetInfo } from '../types';
import { Baby, UserCheck, Accessibility, Plus, Trash2, HeartHandshake, Dog } from 'lucide-react';

interface VulnerabilitiesFormProps {
  value?: HouseholdVulnerabilities;
  onChange: (updated: HouseholdVulnerabilities) => void;
}

export const VulnerabilitiesForm: React.FC<VulnerabilitiesFormProps> = ({
  value = {
    tieneNinos: false,
    ninosInfo: [],
    tieneAdultoMayor: false,
    adultosMayoresInfo: [],
    tieneDiscapacidad: false,
    discapacidadInfo: [],
    tieneMascotas: false,
    mascotasInfo: []
  },
  onChange
}) => {
  // Helpers
  const handleToggleNinos = (checked: boolean) => {
    onChange({
      ...value,
      tieneNinos: checked,
      ninosInfo: checked && (!value.ninosInfo || value.ninosInfo.length === 0) 
        ? [{ id: Date.now().toString(), edad: '1 año', requierePanales: true, etapaPanal: 'Etapa 2', requiereLeche: true, tipoLeche: 'Fórmula Maternizada' }] 
        : (checked ? value.ninosInfo : [])
    });
  };

  const handleAddChild = () => {
    const list = value.ninosInfo || [];
    onChange({
      ...value,
      tieneNinos: true,
      ninosInfo: [...list, { id: Date.now().toString(), edad: '2 años', requierePanales: true, etapaPanal: 'Etapa 3', requiereLeche: false, tipoLeche: 'Leche Entera' }]
    });
  };

  const handleRemoveChild = (index: number) => {
    const list = [...(value.ninosInfo || [])];
    list.splice(index, 1);
    onChange({
      ...value,
      tieneNinos: list.length > 0,
      ninosInfo: list
    });
  };

  const handleUpdateChild = (index: number, updatedItem: ChildNeed) => {
    const list = [...(value.ninosInfo || [])];
    list[index] = updatedItem;
    onChange({
      ...value,
      ninosInfo: list
    });
  };

  // Senior Helpers
  const handleToggleSenior = (checked: boolean) => {
    onChange({
      ...value,
      tieneAdultoMayor: checked,
      adultosMayoresInfo: checked && (!value.adultosMayoresInfo || value.adultosMayoresInfo.length === 0)
        ? [{ id: Date.now().toString(), edad: '70 años', requierePanalesAdulto: false, tallaPanalAdulto: 'L' }]
        : (checked ? value.adultosMayoresInfo : [])
    });
  };

  const handleAddSenior = () => {
    const list = value.adultosMayoresInfo || [];
    onChange({
      ...value,
      tieneAdultoMayor: true,
      adultosMayoresInfo: [...list, { id: Date.now().toString(), edad: '75 años', requierePanalesAdulto: true, tallaPanalAdulto: 'L' }]
    });
  };

  const handleRemoveSenior = (index: number) => {
    const list = [...(value.adultosMayoresInfo || [])];
    list.splice(index, 1);
    onChange({
      ...value,
      tieneAdultoMayor: list.length > 0,
      adultosMayoresInfo: list
    });
  };

  const handleUpdateSenior = (index: number, updatedItem: SeniorNeed) => {
    const list = [...(value.adultosMayoresInfo || [])];
    list[index] = updatedItem;
    onChange({
      ...value,
      adultosMayoresInfo: list
    });
  };

  // Disability Helpers
  const handleToggleDisability = (checked: boolean) => {
    onChange({
      ...value,
      tieneDiscapacidad: checked,
      discapacidadInfo: checked && (!value.discapacidadInfo || value.discapacidadInfo.length === 0)
        ? [{ id: Date.now().toString(), tipoDiscapacidad: 'Física/Movilidad Reducida', requierePanales: false, requiereAyudaTecnica: true, tipoAyudaTecnica: 'Silla de Ruedas' }]
        : (checked ? value.discapacidadInfo : [])
    });
  };

  const handleAddDisability = () => {
    const list = value.discapacidadInfo || [];
    onChange({
      ...value,
      tieneDiscapacidad: true,
      discapacidadInfo: [...list, { id: Date.now().toString(), tipoDiscapacidad: 'Física/Movilidad Reducida', requierePanales: false, requiereAyudaTecnica: false }]
    });
  };

  const handleRemoveDisability = (index: number) => {
    const list = [...(value.discapacidadInfo || [])];
    list.splice(index, 1);
    onChange({
      ...value,
      tieneDiscapacidad: list.length > 0,
      discapacidadInfo: list
    });
  };

  const handleUpdateDisability = (index: number, updatedItem: DisabilityNeed) => {
    const list = [...(value.discapacidadInfo || [])];
    list[index] = updatedItem;
    onChange({
      ...value,
      discapacidadInfo: list
    });
  };

  // Pets / Mascotas Helpers
  const handleToggleMascotas = (checked: boolean) => {
    onChange({
      ...value,
      tieneMascotas: checked,
      mascotasInfo: checked && (!value.mascotasInfo || value.mascotasInfo.length === 0)
        ? [{ id: Date.now().toString(), tipo: 'Perro', cantidad: 1, requiereAlimento: true, detalles: 'Perro criollo mediano' }]
        : (checked ? value.mascotasInfo : [])
    });
  };

  const handleAddPet = () => {
    const list = value.mascotasInfo || [];
    onChange({
      ...value,
      tieneMascotas: true,
      mascotasInfo: [...list, { id: Date.now().toString(), tipo: 'Gato', cantidad: 1, requiereAlimento: true, detalles: '' }]
    });
  };

  const handleRemovePet = (index: number) => {
    const list = [...(value.mascotasInfo || [])];
    list.splice(index, 1);
    onChange({
      ...value,
      tieneMascotas: list.length > 0,
      mascotasInfo: list
    });
  };

  const handleUpdatePet = (index: number, updatedItem: PetInfo) => {
    const list = [...(value.mascotasInfo || [])];
    list[index] = updatedItem;
    onChange({
      ...value,
      mascotasInfo: list
    });
  };

  return (
    <div className="space-y-4 pt-2 border-t border-slate-200 mt-3">
      <div className="flex items-center space-x-2 text-slate-800 font-bold text-xs">
        <HeartHandshake className="w-4 h-4 text-emerald-600" />
        <span>Vulnerabilidades, Necesidades Especiales y Censo del Hogar</span>
      </div>

      {/* SECTION 1: NIÑOS */}
      <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-xs font-bold text-blue-900 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value.tieneNinos)}
              onChange={e => handleToggleNinos(e.target.checked)}
              className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
            />
            <Baby className="w-4 h-4 text-blue-600" />
            <span>¿Hay niños o bebés en el hogar?</span>
          </label>
          {value.tieneNinos && (
            <button
              type="button"
              onClick={handleAddChild}
              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Añadir Niño</span>
            </button>
          )}
        </div>

        {value.tieneNinos && (
          <div className="space-y-2 pt-1">
            {(value.ninosInfo || []).map((child, idx) => (
              <div key={child.id || idx} className="p-2.5 bg-white border border-blue-200 rounded-lg text-xs space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-blue-800 text-[11px]">Niño #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveChild(idx)}
                    className="text-rose-500 hover:text-rose-700 p-0.5 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Edad</label>
                    <input
                      type="text"
                      placeholder="Ej. 1 año, 8 meses"
                      value={child.edad}
                      onChange={e => handleUpdateChild(idx, { ...child, edad: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-700 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={child.requierePanales}
                        onChange={e => handleUpdateChild(idx, { ...child, requierePanales: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>¿Requiere Pañales?</span>
                    </label>
                    {child.requierePanales && (
                      <select
                        value={child.etapaPanal || 'Etapa 2'}
                        onChange={e => handleUpdateChild(idx, { ...child, etapaPanal: e.target.value })}
                        className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800"
                      >
                        <option value="Etapa 1">Etapa 1 (RN)</option>
                        <option value="Etapa 2">Etapa 2</option>
                        <option value="Etapa 3">Etapa 3</option>
                        <option value="Etapa 4">Etapa 4</option>
                        <option value="Etapa 5">Etapa 5</option>
                        <option value="Etapa XX/XXL">Etapa XX / XXL</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-700 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={child.requiereLeche}
                        onChange={e => handleUpdateChild(idx, { ...child, requiereLeche: e.target.checked })}
                        className="rounded border-slate-300 text-blue-600"
                      />
                      <span>¿Requiere Leche/Fórmula?</span>
                    </label>
                    {child.requiereLeche && (
                      <input
                        type="text"
                        placeholder="Ej. Fórmula Maternizada 1"
                        value={child.tipoLeche || ''}
                        onChange={e => handleUpdateChild(idx, { ...child, tipoLeche: e.target.value })}
                        className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 2: ADULTOS MAYORES */}
      <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-xs font-bold text-amber-900 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value.tieneAdultoMayor)}
              onChange={e => handleToggleSenior(e.target.checked)}
              className="rounded border-amber-300 text-amber-600 focus:ring-amber-500"
            />
            <UserCheck className="w-4 h-4 text-amber-600" />
            <span>¿Hay adultos mayores (abuelos/as) en el hogar?</span>
          </label>
          {value.tieneAdultoMayor && (
            <button
              type="button"
              onClick={handleAddSenior}
              className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Añadir Adulto Mayor</span>
            </button>
          )}
        </div>

        {value.tieneAdultoMayor && (
          <div className="space-y-2 pt-1">
            {(value.adultosMayoresInfo || []).map((senior, idx) => (
              <div key={senior.id || idx} className="p-2.5 bg-white border border-amber-200 rounded-lg text-xs space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-800 text-[11px]">Adulto Mayor #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSenior(idx)}
                    className="text-rose-500 hover:text-rose-700 p-0.5 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Edad</label>
                    <input
                      type="text"
                      placeholder="Ej. 78 años"
                      value={senior.edad}
                      onChange={e => handleUpdateSenior(idx, { ...senior, edad: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-700 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={senior.requierePanalesAdulto}
                        onChange={e => handleUpdateSenior(idx, { ...senior, requierePanalesAdulto: e.target.checked })}
                        className="rounded border-slate-300 text-amber-600"
                      />
                      <span>¿Requiere Pañales Adulto?</span>
                    </label>
                    {senior.requierePanalesAdulto && (
                      <select
                        value={senior.tallaPanalAdulto || 'L'}
                        onChange={e => handleUpdateSenior(idx, { ...senior, tallaPanalAdulto: e.target.value })}
                        className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800"
                      >
                        <option value="M">Talla M</option>
                        <option value="L">Talla L</option>
                        <option value="XL">Talla XL</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Detalles o requerimientos</label>
                    <input
                      type="text"
                      placeholder="Ej. Movilidad reducida, medicamentos"
                      value={senior.detalles || ''}
                      onChange={e => handleUpdateSenior(idx, { ...senior, detalles: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: DISCAPACIDAD */}
      <div className="p-3 bg-purple-50/70 border border-purple-200/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-xs font-bold text-purple-900 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value.tieneDiscapacidad)}
              onChange={e => handleToggleDisability(e.target.checked)}
              className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
            />
            <Accessibility className="w-4 h-4 text-purple-600" />
            <span>¿Hay personas con discapacidad en el hogar?</span>
          </label>
          {value.tieneDiscapacidad && (
            <button
              type="button"
              onClick={handleAddDisability}
              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white font-bold text-[11px] rounded-lg flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Añadir Registro</span>
            </button>
          )}
        </div>

        {value.tieneDiscapacidad && (
          <div className="space-y-2 pt-1">
            {(value.discapacidadInfo || []).map((disc, idx) => (
              <div key={disc.id || idx} className="p-2.5 bg-white border border-purple-200 rounded-lg text-xs space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-purple-800 text-[11px]">Discapacidad #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveDisability(idx)}
                    className="text-rose-500 hover:text-rose-700 p-0.5 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Tipo de Discapacidad</label>
                    <select
                      value={disc.tipoDiscapacidad}
                      onChange={e => handleUpdateDisability(idx, { ...disc, tipoDiscapacidad: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800"
                    >
                      <option value="Física/Movilidad Reducida">Física / Movilidad Reducida</option>
                      <option value="Visual">Visual</option>
                      <option value="Auditiva">Auditiva</option>
                      <option value="Cognitiva/Intelectual">Cognitiva / Intelectual</option>
                      <option value="Múltiple">Múltiple</option>
                      <option value="Otra">Otra</option>
                    </select>
                  </div>

                  <div>
                    <label className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-700 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={disc.requierePanales}
                        onChange={e => handleUpdateDisability(idx, { ...disc, requierePanales: e.target.checked })}
                        className="rounded border-slate-300 text-purple-600"
                      />
                      <span>¿Requiere Pañales?</span>
                    </label>
                    {disc.requierePanales && (
                      <select
                        value={disc.tallaPanal || 'L'}
                        onChange={e => handleUpdateDisability(idx, { ...disc, tallaPanal: e.target.value })}
                        className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800"
                      >
                        <option value="Etapa 4">Pañal Niño (Etapa 4/5)</option>
                        <option value="S">Adulto S</option>
                        <option value="M">Adulto M</option>
                        <option value="L">Adulto L</option>
                        <option value="XL">Adulto XL</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-700 mt-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={disc.requiereAyudaTecnica}
                        onChange={e => handleUpdateDisability(idx, { ...disc, requiereAyudaTecnica: e.target.checked })}
                        className="rounded border-slate-300 text-purple-600"
                      />
                      <span>¿Requiere Ayuda Técnica?</span>
                    </label>
                    {disc.requiereAyudaTecnica && (
                      <input
                        type="text"
                        placeholder="Ej. Silla de Ruedas, Muletas, Caminador"
                        value={disc.tipoAyudaTecnica || ''}
                        onChange={e => handleUpdateDisability(idx, { ...disc, tipoAyudaTecnica: e.target.value })}
                        className="w-full mt-1 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 4: CENSO DE MASCOTAS */}
      <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl space-y-2">
        <div className="flex items-center justify-between">
          <label className="flex items-center space-x-2 text-xs font-bold text-emerald-900 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value.tieneMascotas)}
              onChange={e => handleToggleMascotas(e.target.checked)}
              className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500"
            />
            <Dog className="w-4 h-4 text-emerald-600" />
            <span>¿Tienen mascotas en el apartamento / hogar? (Censo de Mascotas)</span>
          </label>
          {value.tieneMascotas && (
            <button
              type="button"
              onClick={handleAddPet}
              className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg flex items-center space-x-1"
            >
              <Plus className="w-3 h-3" />
              <span>Añadir Mascota</span>
            </button>
          )}
        </div>

        {value.tieneMascotas && (
          <div className="space-y-2 pt-1">
            {(value.mascotasInfo || []).map((pet, idx) => (
              <div key={pet.id || idx} className="p-2.5 bg-white border border-emerald-200 rounded-lg text-xs space-y-2 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-800 text-[11px]">Mascota #{idx + 1}</span>
                  <button
                    type="button"
                    onClick={() => handleRemovePet(idx)}
                    className="text-rose-500 hover:text-rose-700 p-0.5 rounded"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Tipo de Mascota</label>
                    <select
                      value={pet.tipo || 'Perro'}
                      onChange={e => handleUpdatePet(idx, { ...pet, tipo: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800"
                    >
                      <option value="Perro">🐶 Perro</option>
                      <option value="Gato">🐱 Gato</option>
                      <option value="Ave">🦜 Ave</option>
                      <option value="Conejo">🐰 Conejo</option>
                      <option value="Otro">🐾 Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={pet.cantidad || 1}
                      onChange={e => handleUpdatePet(idx, { ...pet, cantidad: parseInt(e.target.value, 10) || 1 })}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="flex items-center space-x-1.5 text-[10px] font-bold text-slate-700 mt-1 sm:mt-5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={pet.requiereAlimento ?? true}
                        onChange={e => handleUpdatePet(idx, { ...pet, requiereAlimento: e.target.checked })}
                        className="rounded border-slate-300 text-emerald-600"
                      />
                      <span>¿Requiere Alimento?</span>
                    </label>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-600">Detalles / Raza / Tamaño</label>
                    <input
                      type="text"
                      placeholder="Ej. Criollo mediano, cachorro"
                      value={pet.detalles || ''}
                      onChange={e => handleUpdatePet(idx, { ...pet, detalles: e.target.value })}
                      className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

