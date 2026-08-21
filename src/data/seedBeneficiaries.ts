import { Beneficiary } from '../types';
import { parseAptoCode } from '../lib/aptoParser';

function detectAgrupacion(direccion: string): string {
  const dirUpper = (direccion || '').toUpperCase();
  if (dirUpper.includes('AGRUP 1') || dirUpper.includes('AGRUPACIÓN 1')) return 'Agrupación 1';
  if (dirUpper.includes('AGRUP 2') || dirUpper.includes('AGRUPACIÓN 2')) return 'Agrupación 2';
  if (dirUpper.includes('AGRUP 3') || dirUpper.includes('AGRUPACIÓN 3')) return 'Agrupación 3';
  if (dirUpper.includes('AGRUP 4') || dirUpper.includes('AGRUPACIÓN 4')) return 'Agrupación 4';
  if (dirUpper.includes('AGRUP 5') || dirUpper.includes('AGRUPACIÓN 5')) return 'Agrupación 5';
  if (dirUpper.includes('SECTOR 1') || dirUpper.includes('SECTOR')) return 'Sector 1';
  if (dirUpper.includes('TORRE') || dirUpper.includes('APTO') || dirUpper.includes('BLOQUE')) return 'Torres y Aptos';
  return 'Sector General';
}

export const rawBeneficiariesData = [
  {
    "no": 1,
    "direccion": "Usuario Externo",
    "nombre": "Esmilda Alegría",
    "tipoDocumento": "CC",
    "cedula": "31874459",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 2,
    "direccion": "3E43",
    "nombre": "Richard Giraldo",
    "tipoDocumento": "CC",
    "cedula": "14963561",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 3,
    "direccion": "2C21",
    "nombre": "Johana Rivera",
    "tipoDocumento": "CC",
    "cedula": "1130608151",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 4,
    "direccion": "3C59",
    "nombre": "Elizabeth Saavedra",
    "tipoDocumento": "CC",
    "cedula": "66907213",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 5,
    "direccion": "4C11",
    "nombre": "Jenny G.",
    "tipoDocumento": "CC",
    "cedula": "1107514755",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 6,
    "direccion": "4C12",
    "nombre": "José Manuel Ramírez",
    "tipoDocumento": "CC",
    "cedula": "14971540",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 7,
    "direccion": "Usuario Externo",
    "nombre": "María Jesús Trujillo",
    "tipoDocumento": "CC",
    "cedula": "31869352",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 8,
    "direccion": "2C53",
    "nombre": "Luz Cortes",
    "tipoDocumento": "CC",
    "cedula": "1005974682",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 9,
    "direccion": "2C41",
    "nombre": "Vivian Nuñez",
    "tipoDocumento": "CC",
    "cedula": "29363304",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 10,
    "direccion": "2C1",
    "nombre": "Marlin Moreno",
    "tipoDocumento": "CC",
    "cedula": "29122287",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 11,
    "direccion": "5F43",
    "nombre": "María Nubia Valencia",
    "tipoDocumento": "CC",
    "cedula": "29897790",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 12,
    "direccion": "2C28",
    "nombre": "Paola Ortiz",
    "tipoDocumento": "CC",
    "cedula": "29127864",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 13,
    "direccion": "2B33",
    "nombre": "William Parra",
    "tipoDocumento": "CC",
    "cedula": "1144199776",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 14,
    "direccion": "242",
    "nombre": "Erika Natalia Ruiz",
    "tipoDocumento": "CC",
    "cedula": "1107104861",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 15,
    "direccion": "5B21",
    "nombre": "Alexander Escobar",
    "tipoDocumento": "CC",
    "cedula": "1130610452",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 16,
    "direccion": "5A13",
    "nombre": "Carol Giraldo",
    "tipoDocumento": "CC",
    "cedula": "67013995",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 17,
    "direccion": "Usuario Externo",
    "nombre": "Jhon Raul Quintero",
    "tipoDocumento": "CC",
    "cedula": "1105369958",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 18,
    "direccion": "5D43",
    "nombre": "Carlos Monsalve",
    "tipoDocumento": "CC",
    "cedula": "14623185",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 19,
    "direccion": "4B11",
    "nombre": "Sandra P.",
    "tipoDocumento": "CC",
    "cedula": "1144186174",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 20,
    "direccion": "Usuario Externo",
    "nombre": "Mari Ortiz",
    "tipoDocumento": "CC",
    "cedula": "6682368",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 21,
    "direccion": "2D33",
    "nombre": "Dey Sanchez",
    "tipoDocumento": "CC",
    "cedula": "51776959",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 22,
    "direccion": "2E51",
    "nombre": "Janeth Ruiz",
    "tipoDocumento": "CC",
    "cedula": "31577633",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 23,
    "direccion": "1A22",
    "nombre": "Jhoana C.",
    "tipoDocumento": "CC",
    "cedula": "1053781555",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 24,
    "direccion": "4B12",
    "nombre": "M. Lopez",
    "tipoDocumento": "CC",
    "cedula": "29808471",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 25,
    "direccion": "5C53",
    "nombre": "Stiven P.",
    "tipoDocumento": "CC",
    "cedula": "1151941149",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 26,
    "direccion": "3B54",
    "nombre": "Luis Campo",
    "tipoDocumento": "CC",
    "cedula": "16550801",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 27,
    "direccion": "1C12",
    "nombre": "Aide Ospina",
    "tipoDocumento": "CC",
    "cedula": "38865674",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 28,
    "direccion": "4C12",
    "nombre": "Rosa Montoya",
    "tipoDocumento": "CC",
    "cedula": "31842221",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 29,
    "direccion": "5B13",
    "nombre": "Lizeth A.",
    "tipoDocumento": "CC",
    "cedula": "38566532",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 30,
    "direccion": "2C11",
    "nombre": "Sandra Ruiz",
    "tipoDocumento": "CC",
    "cedula": "67015893",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 31,
    "direccion": "2D51",
    "nombre": "Yolmis Castillo",
    "tipoDocumento": "CC",
    "cedula": "1080833653",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 32,
    "direccion": "3B12",
    "nombre": "Kelly Llorente",
    "tipoDocumento": "CC",
    "cedula": "1144133728",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 33,
    "direccion": "2A21",
    "nombre": "Jairo Sinisterra",
    "tipoDocumento": "CC",
    "cedula": "94073898",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 34,
    "direccion": "3A53",
    "nombre": "Andres Chavez",
    "tipoDocumento": "CC",
    "cedula": "1107520400",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 35,
    "direccion": "4E44",
    "nombre": "N. Torres",
    "tipoDocumento": "CC",
    "cedula": "1143985131",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 36,
    "direccion": "3A13",
    "nombre": "Samuel Rivas",
    "tipoDocumento": "CC",
    "cedula": "1144132865",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 37,
    "direccion": "5D21",
    "nombre": "Kelly Gutierrez",
    "tipoDocumento": "CC",
    "cedula": "1144191384",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 38,
    "direccion": "2A21",
    "nombre": "Esmeralda Rios",
    "tipoDocumento": "CC",
    "cedula": "55150047",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 39,
    "direccion": "5B31",
    "nombre": "Paula Torres",
    "tipoDocumento": "CC",
    "cedula": "1019117651",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 40,
    "direccion": "5B13",
    "nombre": "Valentina Ortiz",
    "tipoDocumento": "CC",
    "cedula": "1144206681",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 41,
    "direccion": "3B12",
    "nombre": "Elodia Jimenez",
    "tipoDocumento": "CC",
    "cedula": "66818635",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 42,
    "direccion": "3A31",
    "nombre": "José Zuñiga",
    "tipoDocumento": "CC",
    "cedula": "60572015",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 43,
    "direccion": "4F41",
    "nombre": "Michel Valencia",
    "tipoDocumento": "CC",
    "cedula": "104620618",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 44,
    "direccion": "2B52",
    "nombre": "Hector Plazas",
    "tipoDocumento": "CC",
    "cedula": "16796279",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 45,
    "direccion": "1B53",
    "nombre": "Paola Ramirez",
    "tipoDocumento": "CC",
    "cedula": "66959153",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 46,
    "direccion": "2B53",
    "nombre": "Maryuri Crespo",
    "tipoDocumento": "CC",
    "cedula": "1130620481",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 47,
    "direccion": "3D31",
    "nombre": "Francy Contrera",
    "tipoDocumento": "CC",
    "cedula": "1101075179",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 48,
    "direccion": "2D12",
    "nombre": "Jhonatan Rodriguez",
    "tipoDocumento": "CC",
    "cedula": "1130625160",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 49,
    "direccion": "5D32",
    "nombre": "Juan Camilo E.",
    "tipoDocumento": "CC",
    "cedula": "1070923675",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 50,
    "direccion": "5A54",
    "nombre": "Genesis Gonzalez",
    "tipoDocumento": "CC",
    "cedula": "5992348",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 51,
    "direccion": "2B52",
    "nombre": "Zoraida Loaiza",
    "tipoDocumento": "CC",
    "cedula": "29122752",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 52,
    "direccion": "2E51",
    "nombre": "Jessica Caicedo",
    "tipoDocumento": "CC",
    "cedula": "1144196125",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 53,
    "direccion": "1E21",
    "nombre": "Shirley Perea",
    "tipoDocumento": "CC",
    "cedula": "66974543",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 54,
    "direccion": "3B22",
    "nombre": "Darwin Torres",
    "tipoDocumento": "CC",
    "cedula": "14639307",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 55,
    "direccion": "5A11",
    "nombre": "Orlando Valencia",
    "tipoDocumento": "CC",
    "cedula": "14470088",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 56,
    "direccion": "4E11",
    "nombre": "Ismenia Riascos",
    "tipoDocumento": "CC",
    "cedula": "31382567",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 57,
    "direccion": "5E43",
    "nombre": "Juan José Lerma",
    "tipoDocumento": "CC",
    "cedula": "1006038413",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 58,
    "direccion": "2A3",
    "nombre": "Jhonny Casanova",
    "tipoDocumento": "CC",
    "cedula": "1087113404",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 59,
    "direccion": "4C32",
    "nombre": "Walter Arias",
    "tipoDocumento": "CC",
    "cedula": "6283870",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 60,
    "direccion": "3A31",
    "nombre": "Bernardo Vega",
    "tipoDocumento": "CC",
    "cedula": "41376298",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 61,
    "direccion": "3A21",
    "nombre": "Ana Valdes",
    "tipoDocumento": "CC",
    "cedula": "1144201454",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 62,
    "direccion": "5E42",
    "nombre": "M. E. Salinas",
    "tipoDocumento": "CC",
    "cedula": "31982197",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 63,
    "direccion": "1C22",
    "nombre": "Diana Melissa Tangarife",
    "tipoDocumento": "CC",
    "cedula": "1144197280",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 64,
    "direccion": "1C23",
    "nombre": "Adriana M. Reyes",
    "tipoDocumento": "CC",
    "cedula": "29583400",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 65,
    "direccion": "2C12",
    "nombre": "German Antonio Ortiz",
    "tipoDocumento": "CC",
    "cedula": "16754052",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 66,
    "direccion": "5A11",
    "nombre": "Geraldin Acosta",
    "tipoDocumento": "CC",
    "cedula": "1107834122",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 67,
    "direccion": "5A21",
    "nombre": "Nelly Sevillan",
    "tipoDocumento": "CC",
    "cedula": "66974892",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 68,
    "direccion": "1A12",
    "nombre": "José Zuluaga",
    "tipoDocumento": "CC",
    "cedula": "1192900064",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 69,
    "direccion": "3D31",
    "nombre": "Elsa Castro",
    "tipoDocumento": "CC",
    "cedula": "37894115",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 70,
    "direccion": "2E14",
    "nombre": "Jorge Gaitan",
    "tipoDocumento": "CC",
    "cedula": "106593385",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 71,
    "direccion": "2A55",
    "nombre": "María Chavez",
    "tipoDocumento": "CC",
    "cedula": "108254459",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 72,
    "direccion": "3A14",
    "nombre": "Ana Osorio",
    "tipoDocumento": "CC",
    "cedula": "66806720",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 73,
    "direccion": "1D5",
    "nombre": "Josefina Uribe",
    "tipoDocumento": "CC",
    "cedula": "24303010",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 74,
    "direccion": "1A43",
    "nombre": "Felipe Hernandez",
    "tipoDocumento": "CC",
    "cedula": "115195",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 75,
    "direccion": "4C24",
    "nombre": "Alexis Hernandez",
    "tipoDocumento": "CC",
    "cedula": "14849174",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 76,
    "direccion": "2C13",
    "nombre": "Gloria Marín",
    "tipoDocumento": "CC",
    "cedula": "31406324",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 77,
    "direccion": "4D21",
    "nombre": "Maricel Olmedo",
    "tipoDocumento": "CC",
    "cedula": "1087125439",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 78,
    "direccion": "4A53",
    "nombre": "Elizabeth García",
    "tipoDocumento": "CC",
    "cedula": "38683909",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 79,
    "direccion": "5C31",
    "nombre": "Marleny Escobar",
    "tipoDocumento": "CC",
    "cedula": "29114160",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 80,
    "direccion": "3B31",
    "nombre": "Olivia Osorio",
    "tipoDocumento": "CC",
    "cedula": "38974522",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 81,
    "direccion": "3B41",
    "nombre": "Darwin O.",
    "tipoDocumento": "CC",
    "cedula": "16790030",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 82,
    "direccion": "5A33",
    "nombre": "Aleida Ortiz",
    "tipoDocumento": "CC",
    "cedula": "31932481",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 83,
    "direccion": "2D53",
    "nombre": "Luz Elena Collazos",
    "tipoDocumento": "CC",
    "cedula": "29306356",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 84,
    "direccion": "2A52",
    "nombre": "Maricel Guzman",
    "tipoDocumento": "CC",
    "cedula": "31831679",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 85,
    "direccion": "5C31",
    "nombre": "G. Real",
    "tipoDocumento": "CC",
    "cedula": "31279792",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 86,
    "direccion": "3B23",
    "nombre": "Isabel I.",
    "tipoDocumento": "CC",
    "cedula": "1119151085",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 87,
    "direccion": "5A42",
    "nombre": "Oscar Z.",
    "tipoDocumento": "CC",
    "cedula": "8601297",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 88,
    "direccion": "2B52",
    "nombre": "M. José Trejos",
    "tipoDocumento": "CC",
    "cedula": "1110051307",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 89,
    "direccion": "3C43",
    "nombre": "Elmira Caicedo",
    "tipoDocumento": "CC",
    "cedula": "31964744",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 90,
    "direccion": "3C31",
    "nombre": "Martha Muñoz",
    "tipoDocumento": "CC",
    "cedula": "113064204",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 91,
    "direccion": "4C23",
    "nombre": "Claudia Velasco",
    "tipoDocumento": "CC",
    "cedula": "29307017",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 92,
    "direccion": "4B44",
    "nombre": "Jhon Guzman",
    "tipoDocumento": "CC",
    "cedula": "1081592064",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 93,
    "direccion": "4D44",
    "nombre": "Leidy V.",
    "tipoDocumento": "CC",
    "cedula": "11802448",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 94,
    "direccion": "2A21",
    "nombre": "Ismael Mosquera",
    "tipoDocumento": "CC",
    "cedula": "6223006",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 95,
    "direccion": "4A32",
    "nombre": "Nora Ramirez",
    "tipoDocumento": "CC",
    "cedula": "38957015",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 96,
    "direccion": "3C32",
    "nombre": "Carlos Piedrahita",
    "tipoDocumento": "CC",
    "cedula": "1143960378",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 97,
    "direccion": "5B24",
    "nombre": "L. Gutierrez",
    "tipoDocumento": "CC",
    "cedula": "1144137431",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 98,
    "direccion": "2D54",
    "nombre": "Angela Martínez",
    "tipoDocumento": "CC",
    "cedula": "1144174630",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 99,
    "direccion": "2E21",
    "nombre": "Rosalia C.",
    "tipoDocumento": "CC",
    "cedula": "66908656",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 100,
    "direccion": "2B33",
    "nombre": "Alvaro Herrera",
    "tipoDocumento": "CC",
    "cedula": "94377395",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 101,
    "direccion": "2A43",
    "nombre": "Luis F. Silva",
    "tipoDocumento": "CC",
    "cedula": "91072948",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 102,
    "direccion": "2A11",
    "nombre": "Gloria Rendón",
    "tipoDocumento": "CC",
    "cedula": "94674379",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 103,
    "direccion": "4C42",
    "nombre": "Felipe Ruiz",
    "tipoDocumento": "CC",
    "cedula": "98451525",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 104,
    "direccion": "3C13",
    "nombre": "Olimpa S.",
    "tipoDocumento": "CC",
    "cedula": "31217885",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 105,
    "direccion": "4A14",
    "nombre": "Alba N. Martínez",
    "tipoDocumento": "CC",
    "cedula": "66856438",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 106,
    "direccion": "4C32",
    "nombre": "Ruben Dario Chuz",
    "tipoDocumento": "CC",
    "cedula": "94074611",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 107,
    "direccion": "332",
    "nombre": "Amparo Abadia",
    "tipoDocumento": "CC",
    "cedula": "31495622",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 108,
    "direccion": "4C44",
    "nombre": "Juan Camilo Velez",
    "tipoDocumento": "CC",
    "cedula": "1192792711",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 109,
    "direccion": "3A53",
    "nombre": "Sonia Lucumi",
    "tipoDocumento": "CC",
    "cedula": "31300092",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 110,
    "direccion": "3A44",
    "nombre": "Laura D.",
    "tipoDocumento": "CC",
    "cedula": "31221720",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 111,
    "direccion": "2D31",
    "nombre": "Wilson Mora",
    "tipoDocumento": "CC",
    "cedula": "16667040",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 112,
    "direccion": "4A44",
    "nombre": "Alexandra T.",
    "tipoDocumento": "CC",
    "cedula": "29106447",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 113,
    "direccion": "4B35",
    "nombre": "Sonia Restrepo",
    "tipoDocumento": "CC",
    "cedula": "31845200",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 114,
    "direccion": "4B34",
    "nombre": "Yerlenis Pineda",
    "tipoDocumento": "CC",
    "cedula": "38560216",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 115,
    "direccion": "1A32",
    "nombre": "Marcela M.",
    "tipoDocumento": "CC",
    "cedula": "31276274",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 116,
    "direccion": "5A32",
    "nombre": "Y. García",
    "tipoDocumento": "CC",
    "cedula": "26312326",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 117,
    "direccion": "2C31",
    "nombre": "Cesar Cardona",
    "tipoDocumento": "CC",
    "cedula": "1112468615",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 118,
    "direccion": "2B11",
    "nombre": "Isabell Gonzalez",
    "tipoDocumento": "CC",
    "cedula": "31308729",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 119,
    "direccion": "2B21",
    "nombre": "Camilo Salazar",
    "tipoDocumento": "CC",
    "cedula": "1144180466",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 120,
    "direccion": "2C32",
    "nombre": "Stella Torres",
    "tipoDocumento": "CC",
    "cedula": "31949549",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 121,
    "direccion": "3A33",
    "nombre": "Cristina Vidal",
    "tipoDocumento": "CC",
    "cedula": "31923817",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 122,
    "direccion": "5A54",
    "nombre": "Sadi Gonzalez",
    "tipoDocumento": "CC",
    "cedula": "38468858",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 123,
    "direccion": "5A41",
    "nombre": "Natalia Z.",
    "tipoDocumento": "CC",
    "cedula": "1144186371",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 124,
    "direccion": "5A24",
    "nombre": "Juan Carlos Benitez",
    "tipoDocumento": "CC",
    "cedula": "16766667",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 125,
    "direccion": "3A42",
    "nombre": "Marlyn Oviedo",
    "tipoDocumento": "CC",
    "cedula": "31280290",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 126,
    "direccion": "5A43",
    "nombre": "Anni Pulgarin",
    "tipoDocumento": "CC",
    "cedula": "1144096665",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 127,
    "direccion": "5A53",
    "nombre": "Ronald Sevillan",
    "tipoDocumento": "CC",
    "cedula": "1143931591",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 128,
    "direccion": "3D24",
    "nombre": "María del Carmen Ruiz",
    "tipoDocumento": "CC",
    "cedula": "66832121",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 129,
    "direccion": "5C33",
    "nombre": "Tibera Mosquera M.",
    "tipoDocumento": "CC",
    "cedula": "16491376",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 130,
    "direccion": "5D54",
    "nombre": "Margarita Rizo",
    "tipoDocumento": "CC",
    "cedula": "31178599",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 131,
    "direccion": "5D12",
    "nombre": "Tatiana Guzman",
    "tipoDocumento": "CC",
    "cedula": "1130666644",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 132,
    "direccion": "2C11",
    "nombre": "Carlos Londoño",
    "tipoDocumento": "CC",
    "cedula": "14624504",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 133,
    "direccion": "5D11",
    "nombre": "Heidy Ortega",
    "tipoDocumento": "CC",
    "cedula": "1143849444",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 134,
    "direccion": "3A12",
    "nombre": "Zoraida Dominguez",
    "tipoDocumento": "CC",
    "cedula": "38730056",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 135,
    "direccion": "2B32",
    "nombre": "Geronimo Espinoza",
    "tipoDocumento": "CC",
    "cedula": "1053786002",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 136,
    "direccion": "5C33",
    "nombre": "Nubia S.",
    "tipoDocumento": "CC",
    "cedula": "38438091",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 137,
    "direccion": "3D31",
    "nombre": "Orlando Suarez",
    "tipoDocumento": "CC",
    "cedula": "91069635",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 138,
    "direccion": "2F11",
    "nombre": "Julian Cardenas",
    "tipoDocumento": "CC",
    "cedula": "10872124200",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 139,
    "direccion": "5A44",
    "nombre": "Patrick Romero",
    "tipoDocumento": "CC",
    "cedula": "38870445",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 140,
    "direccion": "5A41",
    "nombre": "Doli Crespo",
    "tipoDocumento": "CC",
    "cedula": "29305589",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 141,
    "direccion": "5E53",
    "nombre": "A. Nuñez Valencia",
    "tipoDocumento": "CC",
    "cedula": "67017170",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 142,
    "direccion": "2C11",
    "nombre": "Karen N. Burgos",
    "tipoDocumento": "CC",
    "cedula": "1080183353",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 143,
    "direccion": "544",
    "nombre": "Rubiela Pineda",
    "tipoDocumento": "CC",
    "cedula": "41434707",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 144,
    "direccion": "5B42",
    "nombre": "Fernando Monsalve",
    "tipoDocumento": "CC",
    "cedula": "12635493",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 145,
    "direccion": "3F11",
    "nombre": "Natalia T.",
    "tipoDocumento": "CC",
    "cedula": "1151964113",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 146,
    "direccion": "2C13",
    "nombre": "Gloria Nieto",
    "tipoDocumento": "CC",
    "cedula": "31865097",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 147,
    "direccion": "2B14",
    "nombre": "Martha C.",
    "tipoDocumento": "CC",
    "cedula": "38437675",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 148,
    "direccion": "4B14",
    "nombre": "Sugei Sanchez",
    "tipoDocumento": "CC",
    "cedula": "31573466",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 149,
    "direccion": "2B33",
    "nombre": "Marleny Ramirez",
    "tipoDocumento": "CC",
    "cedula": "29199953",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 150,
    "direccion": "2A23",
    "nombre": "Eucaris Pinto",
    "tipoDocumento": "CC",
    "cedula": "60290188",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 151,
    "direccion": "4C14",
    "nombre": "Paula Andrea León",
    "tipoDocumento": "CC",
    "cedula": "66972000",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 152,
    "direccion": "4C52",
    "nombre": "Nelsy P.",
    "tipoDocumento": "CC",
    "cedula": "31380228",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 153,
    "direccion": "3A23",
    "nombre": "Gisella Carabali",
    "tipoDocumento": "CC",
    "cedula": "1130651595",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 154,
    "direccion": "3D53",
    "nombre": "Elpidia C.",
    "tipoDocumento": "CC",
    "cedula": "34690039",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 155,
    "direccion": "3D22",
    "nombre": "Carmen Figueroa",
    "tipoDocumento": "CC",
    "cedula": "38559499",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 156,
    "direccion": "2B23",
    "nombre": "Hernando Cifuentes",
    "tipoDocumento": "CC",
    "cedula": "14946378",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 157,
    "direccion": "4B35",
    "nombre": "Jaime Londoño",
    "tipoDocumento": "CC",
    "cedula": "94385255",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 158,
    "direccion": "Usuario externo",
    "nombre": "Flor Eliza",
    "tipoDocumento": "CC",
    "cedula": "",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 159,
    "direccion": "2D32",
    "nombre": "Adriana Sanchez",
    "tipoDocumento": "CC",
    "cedula": "31581937",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 160,
    "direccion": "2B33",
    "nombre": "Lesly Mosquera L.",
    "tipoDocumento": "CC",
    "cedula": "31610308",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 161,
    "direccion": "4C31",
    "nombre": "Gustavo Ramirez",
    "tipoDocumento": "CC",
    "cedula": "12268039",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 162,
    "direccion": "2B44",
    "nombre": "Gresy Solarza",
    "tipoDocumento": "CC",
    "cedula": "5403891",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 163,
    "direccion": "2A24",
    "nombre": "Amparo Molina",
    "tipoDocumento": "CC",
    "cedula": "31831979",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 164,
    "direccion": "4C52",
    "nombre": "Victor M.",
    "tipoDocumento": "CC",
    "cedula": "16474787",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 165,
    "direccion": "2B13",
    "nombre": "Astrid Hurtado",
    "tipoDocumento": "CC",
    "cedula": "31302089",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 166,
    "direccion": "4C53",
    "nombre": "Rocio Bahamón",
    "tipoDocumento": "CC",
    "cedula": "1130624667",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 167,
    "direccion": "2B24",
    "nombre": "Brayan Andres Trujillo",
    "tipoDocumento": "CC",
    "cedula": "1144147316",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 168,
    "direccion": "2D22",
    "nombre": "Paula González",
    "tipoDocumento": "CC",
    "cedula": "12526251",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 169,
    "direccion": "4C33",
    "nombre": "Ruben Conde",
    "tipoDocumento": "CC",
    "cedula": "7766569",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 170,
    "direccion": "3E44",
    "nombre": "Diego Santos",
    "tipoDocumento": "CC",
    "cedula": "16365680",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 171,
    "direccion": "4B31",
    "nombre": "Sandra Palomino",
    "tipoDocumento": "CC",
    "cedula": "1144186174",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 172,
    "direccion": "4B24",
    "nombre": "Esperanza Martínez",
    "tipoDocumento": "CC",
    "cedula": "55066772",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 173,
    "direccion": "3C44",
    "nombre": "Dilan A.",
    "tipoDocumento": "CC",
    "cedula": "1109547050",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 174,
    "direccion": "4B23",
    "nombre": "Diana Muñoz",
    "tipoDocumento": "CC",
    "cedula": "1144142307",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 175,
    "direccion": "4B32",
    "nombre": "Cristina Mera",
    "tipoDocumento": "CC",
    "cedula": "66919145",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 176,
    "direccion": "2C41",
    "nombre": "Maribel Becerra",
    "tipoDocumento": "CC",
    "cedula": "66741385",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 177,
    "direccion": "4B53",
    "nombre": "Jessica Torres",
    "tipoDocumento": "CC",
    "cedula": "1075247799",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 178,
    "direccion": "4C23",
    "nombre": "Ana Segura",
    "tipoDocumento": "CC",
    "cedula": "31889824",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 179,
    "direccion": "4C51",
    "nombre": "Jhonny Q.",
    "tipoDocumento": "CC",
    "cedula": "31712695",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 180,
    "direccion": "3E11",
    "nombre": "Janeth Alema",
    "tipoDocumento": "CC",
    "cedula": "1082935409",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 181,
    "direccion": "2E03",
    "nombre": "Luz Stella Martínez",
    "tipoDocumento": "CC",
    "cedula": "21075688",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 182,
    "direccion": "3E12",
    "nombre": "Nicolás Quijano",
    "tipoDocumento": "CC",
    "cedula": "1110045365",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 183,
    "direccion": "4B34",
    "nombre": "Soraya Arbelaez",
    "tipoDocumento": "CC",
    "cedula": "65735328",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 184,
    "direccion": "2E11",
    "nombre": "Luz Dary",
    "tipoDocumento": "CC",
    "cedula": "",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 185,
    "direccion": "2E33",
    "nombre": "Sneyder",
    "tipoDocumento": "CC",
    "cedula": "",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 186,
    "direccion": "2B12",
    "nombre": "Jhonatan Rodriguez",
    "tipoDocumento": "CC",
    "cedula": "94550773",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 187,
    "direccion": "2C22",
    "nombre": "Paola Ortiz",
    "tipoDocumento": "CC",
    "cedula": "99127864",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 188,
    "direccion": "4C24",
    "nombre": "Lilian Illera",
    "tipoDocumento": "CC",
    "cedula": "34538712",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 189,
    "direccion": "4C34",
    "nombre": "Carlos Cruz",
    "tipoDocumento": "CC",
    "cedula": "16545497",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 190,
    "direccion": "2A33",
    "nombre": "Omaira Gonzalez",
    "tipoDocumento": "CC",
    "cedula": "38993064",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 191,
    "direccion": "2B34",
    "nombre": "Ofelia Ocampo",
    "tipoDocumento": "CC",
    "cedula": "31886214",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 192,
    "direccion": "2A42",
    "nombre": "Paola Sinisterra",
    "tipoDocumento": "CC",
    "cedula": "31573259",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 193,
    "direccion": "2A41",
    "nombre": "Mara E. Henrry",
    "tipoDocumento": "CC",
    "cedula": "59667418",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 194,
    "direccion": "2A44",
    "nombre": "Rosa Inés Benitez",
    "tipoDocumento": "CC",
    "cedula": "27524434",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 195,
    "direccion": "2A54",
    "nombre": "Franci B.",
    "tipoDocumento": "CC",
    "cedula": "31274785",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 196,
    "direccion": "3C43",
    "nombre": "Carla A. V.",
    "tipoDocumento": "CC",
    "cedula": "1130632888",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 197,
    "direccion": "2B44",
    "nombre": "Nestor Velez",
    "tipoDocumento": "CC",
    "cedula": "19215008",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 198,
    "direccion": "4C11",
    "nombre": "Jorge Humberto Gongora",
    "tipoDocumento": "CC",
    "cedula": "14622236",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 199,
    "direccion": "3E33",
    "nombre": "L. Niño",
    "tipoDocumento": "CC",
    "cedula": "1007652575",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 200,
    "direccion": "3C21",
    "nombre": "Juan Camilo A.",
    "tipoDocumento": "CC",
    "cedula": "1002620528",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 201,
    "direccion": "4C13",
    "nombre": "Guillermo Porras",
    "tipoDocumento": "CC",
    "cedula": "15336743",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 202,
    "direccion": "3B11",
    "nombre": "D. Llorente",
    "tipoDocumento": "CC",
    "cedula": "5219992",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 203,
    "direccion": "4D33",
    "nombre": "Fernando Hidalgo",
    "tipoDocumento": "CC",
    "cedula": "1085301424",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 204,
    "direccion": "2A51",
    "nombre": "Nelsy Mondragon",
    "tipoDocumento": "CC",
    "cedula": "66969329",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 205,
    "direccion": "3D51",
    "nombre": "Tulio E. M.",
    "tipoDocumento": "CC",
    "cedula": "2621927",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 206,
    "direccion": "2A48",
    "nombre": "María Clementina Jimenez",
    "tipoDocumento": "CC",
    "cedula": "31224230",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 207,
    "direccion": "2D11",
    "nombre": "Gentil Sinisterra",
    "tipoDocumento": "CC",
    "cedula": "3670854",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 208,
    "direccion": "Usuario externo",
    "nombre": "Luis Valencia",
    "tipoDocumento": "CC",
    "cedula": "94300603",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 209,
    "direccion": "1B33",
    "nombre": "Olga L. Giraldo",
    "tipoDocumento": "CC",
    "cedula": "1143946430",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 210,
    "direccion": "1A53",
    "nombre": "Daniel Melendi",
    "tipoDocumento": "CC",
    "cedula": "2451718",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 211,
    "direccion": "101",
    "nombre": "Valentina Osorio",
    "tipoDocumento": "CC",
    "cedula": "1193407091",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 212,
    "direccion": "1E502",
    "nombre": "Darma Díaz",
    "tipoDocumento": "CC",
    "cedula": "114386702",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 213,
    "direccion": "5F44",
    "nombre": "Luz Mara Gutierrez",
    "tipoDocumento": "CC",
    "cedula": "22128328",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 214,
    "direccion": "5B34",
    "nombre": "Olvein Restrepo",
    "tipoDocumento": "CC",
    "cedula": "16864197",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 215,
    "direccion": "4A44",
    "nombre": "Jose Agustin G.",
    "tipoDocumento": "CC",
    "cedula": "11311243",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 216,
    "direccion": "5F32",
    "nombre": "Yudy Martinez",
    "tipoDocumento": "CC",
    "cedula": "1087120398",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 217,
    "direccion": "4B23",
    "nombre": "Luis Montes",
    "tipoDocumento": "CC",
    "cedula": "94398020",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 218,
    "direccion": "5A44",
    "nombre": "Sonia Restrepo",
    "tipoDocumento": "CC",
    "cedula": "31895207",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 219,
    "direccion": "5A21",
    "nombre": "Andrea Sevilla",
    "tipoDocumento": "CC",
    "cedula": "11431592",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 220,
    "direccion": "1B44",
    "nombre": "Andrea Restrepo",
    "tipoDocumento": "CC",
    "cedula": "29111498",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 221,
    "direccion": "2B24",
    "nombre": "Doria Ceballos",
    "tipoDocumento": "CC",
    "cedula": "389191965",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 222,
    "direccion": "2C21",
    "nombre": "Katherine Orobia",
    "tipoDocumento": "CC",
    "cedula": "1107846299",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 223,
    "direccion": "4C54",
    "nombre": "Carolina Lerma",
    "tipoDocumento": "CC",
    "cedula": "6694900541",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 224,
    "direccion": "2C23",
    "nombre": "María José Castro",
    "tipoDocumento": "CC",
    "cedula": "113983400",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 225,
    "direccion": "3C54",
    "nombre": "Heidy García",
    "tipoDocumento": "CC",
    "cedula": "5400071",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 226,
    "direccion": "3D54",
    "nombre": "Jean Carlos H.",
    "tipoDocumento": "CC",
    "cedula": "1690384289",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 227,
    "direccion": "1C33",
    "nombre": "José Prieto",
    "tipoDocumento": "CC",
    "cedula": "94455688",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 228,
    "direccion": "4A12",
    "nombre": "Sonia Quintero",
    "tipoDocumento": "CC",
    "cedula": "31872260",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 229,
    "direccion": "5A11",
    "nombre": "Ana Sofia Neisa",
    "tipoDocumento": "CC",
    "cedula": "1022343566",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 230,
    "direccion": "4A54",
    "nombre": "Lila Lopez",
    "tipoDocumento": "CC",
    "cedula": "51260000",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 231,
    "direccion": "3C32",
    "nombre": "Faustin Cuero",
    "tipoDocumento": "CC",
    "cedula": "486594",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 232,
    "direccion": "5C24",
    "nombre": "Paula Rubio",
    "tipoDocumento": "CC",
    "cedula": "10070155360",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 233,
    "direccion": "5C24",
    "nombre": "Paola Salguero",
    "tipoDocumento": "CC",
    "cedula": "66887754",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 234,
    "direccion": "3B12",
    "nombre": "Alba Caicedo",
    "tipoDocumento": "CC",
    "cedula": "31275366",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 235,
    "direccion": "2D53",
    "nombre": "Mauricio Hernandez",
    "tipoDocumento": "CC",
    "cedula": "944565580",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 236,
    "direccion": "2A51",
    "nombre": "Claudia Cecilia Naranjo",
    "tipoDocumento": "CC",
    "cedula": "66842622",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 237,
    "direccion": "311",
    "nombre": "Junior Cabezas",
    "tipoDocumento": "CC",
    "cedula": "1111672465",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 238,
    "direccion": "1C43",
    "nombre": "Martha N.",
    "tipoDocumento": "CC",
    "cedula": "66882908",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 239,
    "direccion": "2C2",
    "nombre": "Leny Valencia",
    "tipoDocumento": "CC",
    "cedula": "38557694",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 240,
    "direccion": "2E12",
    "nombre": "Ronald Arteaga",
    "tipoDocumento": "CC",
    "cedula": "94580081",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 241,
    "direccion": "2D23",
    "nombre": "Catherin Martinez",
    "tipoDocumento": "CC",
    "cedula": "1006073192",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 242,
    "direccion": "2D12",
    "nombre": "Elsa Victoria",
    "tipoDocumento": "CC",
    "cedula": "",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 243,
    "direccion": "2B31",
    "nombre": "Dagoberto Jimenez",
    "tipoDocumento": "CC",
    "cedula": "6316123",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 244,
    "direccion": "2C11",
    "nombre": "O. Gonzalez",
    "tipoDocumento": "CC",
    "cedula": "6630527",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 245,
    "direccion": "1A55",
    "nombre": "Luisa M.",
    "tipoDocumento": "CC",
    "cedula": "41416455",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 246,
    "direccion": "4A23",
    "nombre": "Cristian Altamira",
    "tipoDocumento": "CC",
    "cedula": "1007146127",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 247,
    "direccion": "3D22",
    "nombre": "Miler Ruiz",
    "tipoDocumento": "CC",
    "cedula": "670155895",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 248,
    "direccion": "3D21",
    "nombre": "Luz Aida Cabrera",
    "tipoDocumento": "CC",
    "cedula": "31877398",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 249,
    "direccion": "4A11",
    "nombre": "Jenifer Brusuan",
    "tipoDocumento": "CC",
    "cedula": "15838522",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 250,
    "direccion": "3D51",
    "nombre": "Juliana Loaiza",
    "tipoDocumento": "CC",
    "cedula": "10118048965",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 251,
    "direccion": "2C54",
    "nombre": "Hilda Gomez",
    "tipoDocumento": "CC",
    "cedula": "31863691",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 252,
    "direccion": "2D42",
    "nombre": "Yisel Andrea Ramírez",
    "tipoDocumento": "CC",
    "cedula": "",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 253,
    "direccion": "3D33",
    "nombre": "Mara Estrella Valencia",
    "tipoDocumento": "CC",
    "cedula": "607008322",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 254,
    "direccion": "3C33",
    "nombre": "L. Barrientos",
    "tipoDocumento": "CC",
    "cedula": "29650511",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 255,
    "direccion": "2E42",
    "nombre": "Dora Velez",
    "tipoDocumento": "CC",
    "cedula": "31499372",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 256,
    "direccion": "4B41",
    "nombre": "Nori Clavijo",
    "tipoDocumento": "CC",
    "cedula": "24538975",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 257,
    "direccion": "4D22",
    "nombre": "Luz Marina Colon",
    "tipoDocumento": "CC",
    "cedula": "33207527",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 258,
    "direccion": "4E12",
    "nombre": "Stefani Rivas",
    "tipoDocumento": "CC",
    "cedula": "107032404",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 259,
    "direccion": "4E13",
    "nombre": "M. Floralba P.",
    "tipoDocumento": "CC",
    "cedula": "11210440",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 260,
    "direccion": "1A13",
    "nombre": "Nini Johana Valencia",
    "tipoDocumento": "CC",
    "cedula": "31581201",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 261,
    "direccion": "4C43",
    "nombre": "María Luisa Palacios",
    "tipoDocumento": "CC",
    "cedula": "35892754",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 262,
    "direccion": "5B54",
    "nombre": "Leidy Rodriguez",
    "tipoDocumento": "CC",
    "cedula": "31305962",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 263,
    "direccion": "2E53",
    "nombre": "Monica Hurtado",
    "tipoDocumento": "CC",
    "cedula": "6703055",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 264,
    "direccion": "5E32",
    "nombre": "Betty Tejada",
    "tipoDocumento": "CC",
    "cedula": "31899991",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 265,
    "direccion": "5D43",
    "nombre": "Yessenia Rodriguez",
    "tipoDocumento": "CC",
    "cedula": "441428",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 266,
    "direccion": "3E41",
    "nombre": "Cristina Campo",
    "tipoDocumento": "CC",
    "cedula": "1144207444",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 267,
    "direccion": "5B42",
    "nombre": "Luz Monsalve",
    "tipoDocumento": "CC",
    "cedula": "31846482",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 268,
    "direccion": "5D42",
    "nombre": "Estela Polo",
    "tipoDocumento": "CC",
    "cedula": "26004496",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 269,
    "direccion": "Usuario externo",
    "nombre": "Yessica Montoya",
    "tipoDocumento": "CC",
    "cedula": "24827897",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 270,
    "direccion": "5D22",
    "nombre": "Fanny Murillo",
    "tipoDocumento": "CC",
    "cedula": "45490422",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 271,
    "direccion": "2B53",
    "nombre": "Sandra Patricia Escobar",
    "tipoDocumento": "CC",
    "cedula": "66771924",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 272,
    "direccion": "2B21",
    "nombre": "Ruby Salazar",
    "tipoDocumento": "CC",
    "cedula": "31837466",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 273,
    "direccion": "2B43",
    "nombre": "Guillermo Mina",
    "tipoDocumento": "CC",
    "cedula": "453447296",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 274,
    "direccion": "2B42",
    "nombre": "Brigit Salazar",
    "tipoDocumento": "CC",
    "cedula": "114415",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 275,
    "direccion": "2C12",
    "nombre": "Sofía Amaya",
    "tipoDocumento": "CC",
    "cedula": "1143989243",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 276,
    "direccion": "2B21",
    "nombre": "Neisner G.",
    "tipoDocumento": "CC",
    "cedula": "22740768311",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 277,
    "direccion": "2D5",
    "nombre": "Jhon Fredy A.",
    "tipoDocumento": "CC",
    "cedula": "1144185953",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 278,
    "direccion": "5E11",
    "nombre": "Adrian Duran",
    "tipoDocumento": "CC",
    "cedula": "31865346",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 279,
    "direccion": "Usuario externo",
    "nombre": "Juan Manuel Marin",
    "tipoDocumento": "CC",
    "cedula": "1672344",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 280,
    "direccion": "2B33",
    "nombre": "Lesly Mosquera",
    "tipoDocumento": "CC",
    "cedula": "31610308",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 281,
    "direccion": "2E52",
    "nombre": "Antonio Maya",
    "tipoDocumento": "CC",
    "cedula": "1144079259",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 282,
    "direccion": "5E23",
    "nombre": "Sandra B.",
    "tipoDocumento": "CC",
    "cedula": "66985430",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 283,
    "direccion": "2D21",
    "nombre": "Angie Marcela Lopez",
    "tipoDocumento": "CC",
    "cedula": "1144038355",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 284,
    "direccion": "2D23",
    "nombre": "Catherin Daniela / Adriana",
    "tipoDocumento": "CC",
    "cedula": "66904364",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 285,
    "direccion": "2D12",
    "nombre": "Elsa Victoria Herrera",
    "tipoDocumento": "CC",
    "cedula": "31297294",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 286,
    "direccion": "2D22",
    "nombre": "Paulo Gonzalez",
    "tipoDocumento": "CC",
    "cedula": "12526251",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 287,
    "direccion": "Usuario externo",
    "nombre": "Humberto Rosales Toro",
    "tipoDocumento": "CC",
    "cedula": "10067703",
    "telefono": "3160899305",
    "observaciones": ""
  },
  {
    "no": 288,
    "direccion": "2E11",
    "nombre": "Luis F. Lenis / Luz E. Gonzalez",
    "tipoDocumento": "CC",
    "cedula": "16635394",
    "telefono": "3103593032",
    "observaciones": ""
  },
  {
    "no": 289,
    "direccion": "Usuario externo",
    "nombre": "Tiberio Mosquera Mancilla",
    "tipoDocumento": "CC",
    "cedula": "16491376",
    "telefono": "3013681958",
    "observaciones": ""
  },
  {
    "no": 290,
    "direccion": "2B24",
    "nombre": "Sonia Andrade",
    "tipoDocumento": "CE",
    "cedula": "176776",
    "telefono": "3105842306",
    "observaciones": ""
  },
  {
    "no": 291,
    "direccion": "Usuario externo",
    "nombre": "Gely Reyes",
    "tipoDocumento": "CC",
    "cedula": "1130661421",
    "telefono": "3173584265",
    "observaciones": ""
  },
  {
    "no": 292,
    "direccion": "2B42",
    "nombre": "Luz Mary Salazar",
    "tipoDocumento": "CC",
    "cedula": "31971380",
    "telefono": "3181351770",
    "observaciones": ""
  },
  {
    "no": 293,
    "direccion": "4B23",
    "nombre": "Diana María Muñoz Rivas",
    "tipoDocumento": "CC",
    "cedula": "1144142307",
    "telefono": "3016304354",
    "observaciones": ""
  },
  {
    "no": 294,
    "direccion": "4B54",
    "nombre": "Lidia Lopez",
    "tipoDocumento": "CC",
    "cedula": "31260000",
    "telefono": "3008515106",
    "observaciones": ""
  },
  {
    "no": 295,
    "direccion": "4B53",
    "nombre": "Mary Cabal",
    "tipoDocumento": "CC",
    "cedula": "31177169",
    "telefono": "3174973718",
    "observaciones": ""
  },
  {
    "no": 296,
    "direccion": "5C12",
    "nombre": "Aide Ospina",
    "tipoDocumento": "CC",
    "cedula": "38865674",
    "telefono": "3144519555",
    "observaciones": ""
  },
  {
    "no": 297,
    "direccion": "4B34",
    "nombre": "Cristina Mera",
    "tipoDocumento": "CC",
    "cedula": "66919145",
    "telefono": "3122266182",
    "observaciones": ""
  },
  {
    "no": 298,
    "direccion": "2B24",
    "nombre": "Heidy Ortega",
    "tipoDocumento": "CC",
    "cedula": "114384944",
    "telefono": "3181926490",
    "observaciones": ""
  },
  {
    "no": 299,
    "direccion": "2B24",
    "nombre": "Sonia Andrade",
    "tipoDocumento": "CE",
    "cedula": "176776",
    "telefono": "3108842306",
    "observaciones": ""
  },
  {
    "no": 300,
    "direccion": "Usuario externo",
    "nombre": "Victor Mayona",
    "tipoDocumento": "CC",
    "cedula": "16623303",
    "telefono": "",
    "observaciones": ""
  },
  {
    "no": 301,
    "direccion": "5B33",
    "nombre": "Nubia Hidalgo",
    "tipoDocumento": "CC",
    "cedula": "38438091",
    "telefono": "3172701157",
    "observaciones": ""
  },
  {
    "no": 302,
    "direccion": "4B11",
    "nombre": "Tachi Paola Candelo",
    "tipoDocumento": "CC",
    "cedula": "1148690933",
    "telefono": "3150662330",
    "observaciones": ""
  },
  {
    "no": 303,
    "direccion": "4B13",
    "nombre": "Luis Benavides",
    "tipoDocumento": "CC",
    "cedula": "12977293",
    "telefono": "3136014957",
    "observaciones": ""
  },
  {
    "no": 304,
    "direccion": "4B23",
    "nombre": "Karen Gomez",
    "tipoDocumento": "CC",
    "cedula": "1052992754",
    "telefono": "3157261176",
    "observaciones": ""
  },
  {
    "no": 305,
    "direccion": "4B31",
    "nombre": "Sandra Palomino",
    "tipoDocumento": "CC",
    "cedula": "1144186174",
    "telefono": "3172486745",
    "observaciones": ""
  },
  {
    "no": 306,
    "direccion": "5A23",
    "nombre": "Cristian Rivera",
    "tipoDocumento": "CC",
    "cedula": "1059598188",
    "telefono": "3177174853",
    "observaciones": ""
  },
  {
    "no": 307,
    "direccion": "5E22",
    "nombre": "David Esteban Chacón",
    "tipoDocumento": "TI",
    "cedula": "1104826659",
    "telefono": "3002876492",
    "observaciones": ""
  },
  {
    "no": 308,
    "direccion": "4B21",
    "nombre": "Francisco Belalcazar",
    "tipoDocumento": "CC",
    "cedula": "16885540",
    "telefono": "3115866325",
    "observaciones": ""
  }
];

export const seedBeneficiaries: Beneficiary[] = rawBeneficiariesData.map((item) => {
  const isExternal = item.direccion.toLowerCase().includes('externo') || (item.observaciones || '').toLowerCase().includes('externo');
  const parsed = parseAptoCode(item.direccion);
  const agrupacionFinal = isExternal ? 'Usuarios Externos' : (parsed.isParsed ? parsed.agrupacion : detectAgrupacion(item.direccion));
  const sectorFinal = isExternal ? 'Usuarios Externos' : (parsed.sector || 'Sector 1');
  
  // Delivery date set to 18/08/2026 09:30 ISO
  const deliveryIsoDate = new Date('2026-08-18T09:30:00.000Z').toISOString();
  const cleanDir = isExternal ? 'Usuario Externo' : item.direccion;

  return {
    id: `ben-${item.no}`,
    no: item.no,
    nombre: item.nombre,
    tipoDocumento: (item.tipoDocumento as any) || 'CC',
    cedula: item.cedula,
    direccion: cleanDir,
    sector: sectorFinal,
    agrupacion: agrupacionFinal,
    descripcion: isExternal ? `Usuario Externo (${item.nombre})` : (parsed.descripcion || item.direccion),
    telefono: item.telefono || '',
    integrantesHogar: 0,
    censoActualizado: false,
    prioridadEspecial: false,
    estadoEntrega: 'ENTREGADO',
    fechaUltimaEntrega: deliveryIsoDate,
    historialEntregas: [
      {
        id: `del-seed-${item.no}`,
        beneficiarioId: `ben-${item.no}`,
        beneficiarioNombre: item.nombre,
        beneficiarioCedula: item.cedula,
        beneficiarioDireccion: cleanDir,
        sector: sectorFinal,
        agrupacion: agrupacionFinal,
        fecha: deliveryIsoDate,
        articulos: [
          {
            itemId: 'inv-1',
            itemNombre: 'Kit de Mercado Familiar',
            cantidad: 1,
            unidad: 'Kits'
          }
        ],
        responsable: 'Operador Voluntario - Brigada Chiminangos',
        firmaDigital: 'Verificado Presencial / Documento Cédula ' + item.cedula,
        observaciones: isExternal ? 'Entrega a usuario externo fuera del sector' : 'Entrega en punto registrado (18/08/2026 09:30)',
        estado: 'COMPLETADO'
      }
    ]
  };
});
