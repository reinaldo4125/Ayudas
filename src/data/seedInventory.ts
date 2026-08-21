import { InventoryItem } from '../types';

export const seedInventory: InventoryItem[] = [
  {
    id: 'inv-1',
    codigo: 'INS-ALM-001',
    nombre: 'Mercado Familiar de Alimentos (Mercado Chiminangos)',
    categoria: 'Alimentos',
    unidadMedida: 'Kits',
    stockInicial: 400,
    stockActual: 92,
    stockEntregado: 308,
    stockMinimoAlerta: 50,
    descripcion: 'Kit básico con arroz, grano, aceite, azúcar, sal, enlatados y harinas para la comunidad de Chiminangos.',
    ubicacionBodega: 'Estante A-1 (Bodega Principal)',
    fechaUltimoIngreso: new Date().toISOString()
  }
];

