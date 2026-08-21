export interface DeliveryItem {
  itemId: string;
  itemNombre: string;
  cantidad: number;
  unidad: string;
}

export interface DeliveryRecord {
  id: string;
  beneficiarioId: string;
  beneficiarioNombre: string;
  beneficiarioTipoDocumento?: string;
  beneficiarioCedula: string;
  beneficiarioDireccion: string;
  sector?: string; // e.g. "Sector 1", "Sector 2", ..., "Sector 7", "Usuarios Externos"
  agrupacion: string;
  fecha: string; // ISO string
  articulos: DeliveryItem[];
  responsable: string;
  firmaDigital?: string;
  observaciones?: string;
  estado: 'COMPLETADO' | 'CANCELADO';
}

export interface ChildNeed {
  id?: string;
  edad: string; // e.g. "1 año", "6 meses", "3 años"
  requierePanales: boolean;
  etapaPanal?: string; // e.g., "Etapa 1", "Etapa 2", "Etapa 3", "Etapa 4", "Etapa 5", "Etapa XX/XXL"
  requiereLeche: boolean;
  tipoLeche?: string; // e.g. "Fórmula Maternizada", "Leche Entera", "Fórmula Especial"
}

export interface SeniorNeed {
  id?: string;
  edad: string; // e.g. "72 años"
  requierePanalesAdulto: boolean;
  tallaPanalAdulto?: string; // e.g. "M", "L", "XL"
  detalles?: string;
}

export interface DisabilityNeed {
  id?: string;
  tipoDiscapacidad: string; // e.g. "Física/Movilidad", "Visual", "Auditiva", "Cognitiva/Intelectual", "Múltiple", "Otra"
  descripcion?: string;
  requierePanales?: boolean;
  tallaPanal?: string;
  requiereAyudaTecnica?: boolean;
  tipoAyudaTecnica?: string; // e.g. "Silla de Ruedas", "Muletas", "Caminador", "Bastón", "Prótesis"
}

export interface PetInfo {
  id?: string;
  tipo: 'Perro' | 'Gato' | 'Ave' | 'Conejo' | 'Otro' | string;
  cantidad: number;
  requiereAlimento?: boolean;
  detalles?: string; // e.g. "Perro criollo mediano", "Gato esterilizado"
}

export interface HouseholdVulnerabilities {
  tieneNinos?: boolean;
  ninosInfo?: ChildNeed[];
  tieneAdultoMayor?: boolean;
  adultosMayoresInfo?: SeniorNeed[];
  tieneDiscapacidad?: boolean;
  discapacidadInfo?: DisabilityNeed[];
  tieneMascotas?: boolean;
  mascotasInfo?: PetInfo[];
}

export interface Beneficiary {
  id: string;
  no: number;
  nombre: string;
  tipoDocumento?: 'CC' | 'TI' | 'CE' | 'PASAPORTE' | 'PPT' | 'OTRO' | string;
  cedula: string;
  direccion: string;
  sector?: string; // e.g. "Sector 1", "Sector 2", ..., "Sector 7", "Usuarios Externos"
  agrupacion: string; // e.g. "Agrupación 1", "Agrupación 2", "Sector 1", "Torre B", etc.
  telefono: string;
  integrantesHogar: number;
  censoActualizado?: boolean;
  prioridadEspecial: boolean;
  vulnerabilidades?: HouseholdVulnerabilities;
  estadoEntrega: 'PENDIENTE' | 'ENTREGADO' | 'EN_PROCESO';
  fechaUltimaEntrega?: string;
  observaciones?: string;
  descripcion?: string; // Automatically computed location description (e.g., Sector 1 Agrupación 4 Torre B Apto 42)
  historialEntregas?: DeliveryRecord[];
}

export interface InventoryItem {
  id: string;
  codigo: string;
  nombre: string;
  categoria: 'Alimentos' | 'Aseo' | 'Vestuario' | 'Salud' | 'Infantil' | 'Hogar' | 'Otros';
  unidadMedida: 'Kits' | 'Unidades' | 'Cajas' | 'Bolsas' | 'Litros' | 'Kilos';
  stockInicial: number;
  stockActual: number;
  stockEntregado: number;
  stockMinimoAlerta: number;
  descripcion?: string;
  ubicacionBodega?: string;
  fechaUltimoIngreso?: string;
}

export interface InventoryMovement {
  id: string;
  itemId: string;
  tipo: 'ENTRADA' | 'SALIDA_ENTREGA' | 'AJUSTE';
  cantidad: number;
  fecha: string;
  referencia: string;
  usuario: string;
}

export interface SummaryStats {
  totalBeneficiarios: number;
  totalAptosUnicos: number;
  aptosConEntrega: number;
  aptosConMultiplesEntregas: number;
  totalMercadosEntregados: number;
  entregasResidentes?: number;
  entregasExternos?: number;
  beneficiariosEntregados: number;
  beneficiariosPendientes: number;
  porcentajeCobertura: number;
  totalInsumosEntregados: number;
  totalStockDisponible: number;
  itemsStockBajo: number;
}

export interface AIAssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
