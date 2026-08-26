import { PersonRecord } from '../types';

export interface CensusSeedRecord {
  aptoCode: string; // e.g., "2E42"
  propietario: {
    nombre: string;
    cedula: string;
    telefono: string;
    email?: string;
  };
  tipoOcupante?: 'DUEÑO' | 'ARRENDADO' | 'DESOCUPADO' | 'OTRO';
  personasAdicionales?: PersonRecord[];
  observaciones?: string;
}

export class SeedCensus {
  // Parsed records directly from the official census document
  static records: CensusSeedRecord[] = [
    {
      aptoCode: '2E42',
      propietario: { nombre: 'SHIRLEY LOURIDO BLANDON', cedula: '38.889.600', telefono: '3107385071' },
      personasAdicionales: [
        { id: 'c_2e42_1', nombre: 'CENOBIA BLANDON VANEGAS', rol: 'COPROPIETARIO', cedula: '29.276.162' }
      ]
    },
    {
      aptoCode: '4B42',
      propietario: { nombre: 'NHORA BARRIOS DE DURAN', cedula: '28.525.394', telefono: '3163497238' },
      personasAdicionales: [
        { id: 'c_4b42_1', nombre: 'REINALDO DURAN', rol: 'COPROPIETARIO', cedula: '14.235.709' },
        { id: 'c_4b42_2', nombre: 'DAMARIS CASTRO GAREZON', rol: 'FAMILIAR', cedula: '31.597.592', telefono: '3163497238', observaciones: 'PENDIENTE ENTREGA DE DOCUMENTOS' }
      ],
      observaciones: 'PENDIENTE ENTREGA DE DOCUMENTOS'
    },
    {
      aptoCode: '5B23',
      propietario: { nombre: 'MARIA CONSUELO ORTIZ NARANJO', cedula: '30.357.170', telefono: '3008139593' },
      personasAdicionales: [
        { id: 'c_5b23_1', nombre: 'ELBER JUNIOR MORA ORTIZ', rol: 'FAMILIAR', cedula: '1109660224', observaciones: 'PENDIENTE ENTREGA RECIBO SERVICIOS' }
      ],
      observaciones: 'PENDIENTE ENTREGA RECIBO SERVICIOS'
    },
    {
      aptoCode: '2D42',
      propietario: { nombre: 'LUIS ALBERTO ARCE MARTINEZ', cedula: '16729499', telefono: '3158157696' },
      personasAdicionales: [
        { id: 'c_2d42_1', nombre: 'MARIA ELENA VELA GONZALEZ', rol: 'FAMILIAR', cedula: '31906352' }
      ],
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '2D41',
      propietario: { nombre: 'ANDREA RAMIREZ GARCIA', cedula: '67030187', telefono: '3160173109' },
      personasAdicionales: [
        { id: 'c_2d41_1', nombre: 'BRAIDEN ROJAS RAMIREZ', rol: 'FAMILIAR', observaciones: 'TARJETA DE IDENTIDAD' },
        { id: 'c_2d41_2', nombre: 'BRANDON ROJAS RAMIREZ', rol: 'FAMILIAR', observaciones: 'TARJETA IDENTIDAD PENDIENTE ENTREGA DE DOCUMENTOS' }
      ],
      observaciones: 'PENDIENTE ENTREGA DE DOCUMENTOS'
    },
    {
      aptoCode: '3E51',
      propietario: { nombre: 'MARTHA LUCIA ESTRADA VILLADA', cedula: '43002616', telefono: '3002730133' },
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS LIDER TORRE'
    },
    {
      aptoCode: '3E54',
      propietario: { nombre: 'IBETH DAVILA ZORRILA', cedula: '38436025', telefono: '3225883846' },
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '1B54',
      propietario: { nombre: 'JULIO ANCIZAR FRANCO', cedula: '14.440.947', telefono: '3175638782' },
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '5A24',
      propietario: { nombre: 'YOLANDA PEREZ PEREZ', cedula: '29503211', telefono: '3164475899' },
      personasAdicionales: [
        { id: 'c_5a24_1', nombre: 'JUAN CARLOS BENITEZ', rol: 'COPROPIETARIO', cedula: '16766667' },
        { id: 'c_5a24_2', nombre: 'GILMA TRUJILLO', rol: 'FAMILIAR', cedula: '31298036' },
        { id: 'c_5a24_3', nombre: 'FABIOLA PEREZ PEREZ', rol: 'FAMILIAR', cedula: '29499572' }
      ],
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '4A24',
      propietario: { nombre: 'CLAUDIA MILENA RIOS', cedula: '66850081', telefono: '3113308346' },
      personasAdicionales: [
        { id: 'c_4a24_1', nombre: 'JOSE CLEVER YELA', rol: 'COPROPIETARIO', cedula: '15813528' },
        { id: 'c_4a24_2', nombre: 'MIGUEL ANGEL YELA', rol: 'FAMILIAR', observaciones: 'Cedula pendiente' },
        { id: 'c_4a24_3', nombre: 'LAURA CATALINA YELA', rol: 'FAMILIAR', observaciones: 'Cedula pendiente' }
      ],
      observaciones: 'PENDIENTE NUMEROS DE CEDULA Y DOCUMENTOS'
    },
    {
      aptoCode: '2D52',
      propietario: { nombre: 'JENNY FERNANDA FAJARDO', cedula: '11783302', telefono: '3209492176' },
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '2D33',
      propietario: { nombre: 'CARLOS JAVIER MARTINEZ', cedula: '94491284', telefono: '3108207233' },
      personasAdicionales: [
        { id: 'c_2d33_1', nombre: 'ADRIANA SANCHEZ', rol: 'COPROPIETARIO', cedula: '31581937' },
        { id: 'c_2d33_2', nombre: 'JUAN JOSE MARTINEZ', rol: 'FAMILIAR', cedula: '1109667455' },
        { id: 'c_2d33_3', nombre: 'VALENTINA MARTINEZ', rol: 'FAMILIAR', cedula: '1109926744', observaciones: 'TI' }
      ],
      observaciones: 'PENDIENTE ENTREGA DE DOCUMENTOS'
    },
    {
      aptoCode: '4B21',
      propietario: { nombre: 'ISABEL AROYO HURTADO', cedula: '29508923', telefono: '3232025634' },
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '4A14',
      propietario: { nombre: 'ALBA NELLY GARCIA RENTERIA', cedula: '66856438', telefono: '3164033961' },
      personasAdicionales: [
        { id: 'c_4a14_1', nombre: 'LAURA ALVAREZ MARTINEZ', rol: 'FAMILIAR', cedula: '1006048458' },
        { id: 'c_4a14_2', nombre: 'CARLOS ALBERTO ALVAREZ', rol: 'FAMILIAR', cedula: '94252541' },
        { id: 'c_4a14_3', nombre: 'JOSEV ALVEIRO ALVAREZ', rol: 'FAMILIAR', cedula: '94251225' }
      ],
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '2E52',
      propietario: { nombre: 'EDGAR ANTONIO ORDOÑEZ MAYA', cedula: '1114079256', telefono: '3026155440' },
      personasAdicionales: [
        { id: 'c_2e52_1', nombre: 'VANESA ATEORTUA GALLEGO', rol: 'COPROPIETARIO', cedula: '1107521599' },
        { id: 'c_2e52_2', nombre: 'JOEL FERNANDO LOPEZ ATEOURTUA', rol: 'FAMILIAR', observaciones: 'REGISTRO CIVIL XXX' }
      ],
      observaciones: 'PENDIENTE ENTREGA DE DOCUMENTOS'
    },
    {
      aptoCode: '4B34',
      propietario: { nombre: 'ANGIE CRISTINA ORTEGA MERA', cedula: '1005894954', telefono: '3216357644' },
      personasAdicionales: [
        { id: 'c_4b34_1', nombre: 'MARIA CRISTINA MERA FIGUEROA', rol: 'FAMILIAR', cedula: '66919145' }
      ]
    },
    {
      aptoCode: '2D12',
      propietario: { nombre: 'ELSA VICTORIA HERRERA', cedula: '31297294', telefono: '3225954107' }
    },
    {
      aptoCode: '2D23',
      propietario: { nombre: 'JHOLLY ADRIANA COMETA VICTORIA', cedula: '66904364', telefono: '3225954107' },
      personasAdicionales: [
        { id: 'c_2d23_1', nombre: 'CATHERINE DANIELA MARTINEZ', rol: 'FAMILIAR', cedula: '1006073192' },
        { id: 'c_2d23_2', nombre: 'PAOLA ANDREA MARTINEZ COMETA', rol: 'FAMILIAR', cedula: '1107864206' }
      ],
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '3D24',
      propietario: { nombre: 'MARIA DEL CARMEN RUIZ RUIZ', cedula: '66832121', telefono: '31870030669' }
    },
    {
      aptoCode: '3D31',
      propietario: { nombre: 'BOLIVA OSORIO', cedula: '38970526', telefono: '3165246022' },
      personasAdicionales: [
        { id: 'c_3d31_1', nombre: 'PAULA ANDREA OSORIO', rol: 'FAMILIAR', cedula: '66842201' }
      ],
      observaciones: 'PENDIENTE DE LA ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '1C34',
      propietario: { nombre: 'FABIAN QUIGUANAS', cedula: '16614498', telefono: '3146837524' },
      observaciones: 'PENDIENTE ENTREGA DE DOCUMENTOS'
    },
    {
      aptoCode: '4C44',
      propietario: { nombre: 'KATERINA LONDOÑO GONZALEZ', cedula: '1007864111', telefono: '3174239044' },
      personasAdicionales: [
        { id: 'c_4c44_1', nombre: 'MATTHEW CUERVO LONDOÑO', rol: 'FAMILIAR', cedula: '1108654411', observaciones: 'REGISTRO CIVIL' }
      ],
      observaciones: 'PENDIENTE ENVIO DE DOCUMENTOS'
    },
    {
      aptoCode: '3E42',
      propietario: { nombre: 'MARIA CAMILA ARIAS CERON', cedula: '1144197537', telefono: '3103704451' },
      personasAdicionales: [
        { id: 'c_3e42_1', nombre: 'JENNY PATRICIA ARIAS CERON', rol: 'COPROPIETARIO', cedula: '67010491' },
        { id: 'c_3e42_2', nombre: 'ELIZABETH CERON', rol: 'FAMILIAR', cedula: '28600468' }
      ],
      observaciones: 'PENDIENTE ENVIO DIGITAL'
    },
    {
      aptoCode: '3D21',
      propietario: { nombre: 'LUZ AIDA CABRERA', cedula: '31877398', telefono: '3118361048' }
    },
    {
      aptoCode: '4C23',
      propietario: { nombre: 'ANA BEIBA SEGURA HIDROBO', cedula: '31889824', telefono: '3145014631' },
      personasAdicionales: [
        { id: 'c_4c23_1', nombre: 'JOSE GOMEZ BEDOYA', rol: 'COPROPIETARIO', cedula: '16731908' }
      ]
    },
    {
      aptoCode: '4C24',
      propietario: { nombre: 'JOSE EDUARDO ALAPE REALPE', cedula: '10540709', telefono: '3145741307' },
      personasAdicionales: [
        { id: 'c_4c24_1', nombre: 'LILIANA ILLERA ARAGON', rol: 'COPROPIETARIO', cedula: '34538702' },
        { id: 'c_4c24_2', nombre: 'EDUARDO JOSE ALAPE ILLERA', rol: 'FAMILIAR', cedula: '102955692' },
        { id: 'c_4c24_3', nombre: 'MAURICIO ANDRES ALAPE ILLERA', rol: 'FAMILIAR', cedula: '102819837' }
      ]
    },
    {
      aptoCode: '2C13',
      propietario: { nombre: 'GERMAN ANTONIO ORTIZ ANDRADE', cedula: '16754052', telefono: '3186265033' },
      personasAdicionales: [
        { id: 'c_2c13_1', nombre: 'MARIA MAYERLY BARRERA MARTINEZ', rol: 'COPROPIETARIO', cedula: '1144147846' }
      ]
    },
    {
      aptoCode: '4B14',
      propietario: { nombre: 'JAIRO VIVAS PACHECO', cedula: '19.153.423', telefono: '3205830274' },
      observaciones: 'PENDIENTE ENTREGA DE DOCUMENTOS'
    },
    {
      aptoCode: '4C31',
      propietario: { nombre: 'GUSTAVO RAMIREZ GARCES', cedula: '12268039', telefono: '3184509150' }
    },
    {
      aptoCode: '4A33',
      propietario: { nombre: 'DOLLY PEÑA DELGADO', cedula: '66880109', telefono: '3113666168' },
      personasAdicionales: [
        { id: 'c_4a33_1', nombre: 'JUAN CAMILO CASTRO PEÑA', rol: 'FAMILIAR', cedula: '1010145575' }
      ],
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '4A21',
      propietario: { nombre: 'DEYANIRA RUIZ BENITEZ', cedula: '31258506', telefono: '3166978408' },
      personasAdicionales: [
        { id: 'c_4a21_1', nombre: 'ISABELLA ORTIZ MOLINA', rol: 'FAMILIAR', cedula: '10055743905' },
        { id: 'c_4a21_2', nombre: 'IRLEY MOLINA LONDOÑO', rol: 'FAMILIAR', cedula: '14947917' },
        { id: 'c_4a21_3', nombre: 'DANIELA MOLINA', rol: 'FAMILIAR' },
        { id: 'c_4a21_4', nombre: 'LINA PATRICIA MOLINA RUIZ', rol: 'FAMILIAR', cedula: '31567382' },
        { id: 'c_4a21_5', nombre: 'MARIA JOSE ORTIZ MOLINA', rol: 'FAMILIAR', cedula: '109674522', observaciones: 'TI' }
      ]
    },
    {
      aptoCode: '1C33',
      propietario: { nombre: 'LEONOR CELIS', cedula: '37815782', telefono: '3025284272' },
      observaciones: 'PENDIENTE DOCUMENTOS'
    },
    {
      aptoCode: '1C52',
      propietario: { nombre: 'JUAN CARLOS ROA', cedula: '94400660', telefono: '' },
      observaciones: 'PENDIENTE DOCUMENTOS'
    },
    {
      aptoCode: '2C52',
      propietario: { nombre: 'VICTOR ALFONSO MORA', cedula: '', telefono: '3147532002' },
      personasAdicionales: [
        { id: 'c_2c52_1', nombre: 'NELCIDA PANESO AGUIRRE', rol: 'COPROPIETARIO', cedula: '31380228' }
      ]
    },
    {
      aptoCode: '4B24',
      propietario: { nombre: 'GLORIA INES OLAYA DELGADO', cedula: '', telefono: '3105986718' },
      tipoOcupante: 'DUEÑO'
    },
    {
      aptoCode: '4C51',
      propietario: { nombre: 'ESMERALDA MARIN', cedula: '31832024', telefono: '3226520419' },
      personasAdicionales: [
        { id: 'c_4c51_1', nombre: 'JENNY LIDNEY QUITIAQUEZ MARIN', rol: 'FAMILIAR', cedula: '37712695' },
        { id: 'c_4c51_2', nombre: 'JUAN CAMILO CARRERA VELEZ', rol: 'FAMILIAR', cedula: '1192792711' }
      ]
    },
    {
      aptoCode: '4B53',
      propietario: { nombre: 'JESSICA LORENA TORRES', cedula: '1075247799', telefono: '3235738232' },
      personasAdicionales: [
        { id: 'c_4b53_1', nombre: 'CESAR OLIVO QUINTERO CASTRILLON', rol: 'COPROPIETARIO', cedula: '1006509595' },
        { id: 'c_4b53_2', nombre: 'BRILLITH SALOME PALMA TORRES', rol: 'FAMILIAR', cedula: '1076918101', observaciones: 'TI' }
      ]
    },
    {
      aptoCode: '5A11',
      propietario: { nombre: 'JAVIER MAURICIO ACOSTA DIAZ', cedula: '94411982', telefono: '3046301593' },
      personasAdicionales: [
        { id: 'c_5a11_1', nombre: 'MARISOL SALAZAR MONA', rol: 'COPROPIETARIO', cedula: '38560533' },
        { id: 'c_5a11_2', nombre: 'GERALDINE ACOSTA SALAZAR', rol: 'FAMILIAR', cedula: '1107834123' },
        { id: 'c_5a11_3', nombre: 'VALENTINA ACOSTA SALAZAR', rol: 'FAMILIAR', cedula: '1110294930' }
      ]
    },
    {
      aptoCode: '4A12',
      propietario: { nombre: 'RODRIGO GARCIA HERNANDEZ', cedula: '16664295', telefono: '3113882533' },
      personasAdicionales: [
        { id: 'c_4a12_1', nombre: 'SONIA QUINTERO MACIAS', rol: 'COPROPIETARIO', cedula: '31877269' }
      ],
      observaciones: 'PENDIENTE DOCUMENTOS'
    },
    {
      aptoCode: '4C12',
      propietario: { nombre: 'ROSITA MONTOYA PANTOJA', cedula: '31842221', telefono: '3154741221' },
      personasAdicionales: [
        { id: 'c_4c12_1', nombre: 'LUIS ALBEIRO RINCON MONTOYA', rol: 'COPROPIETARIO', cedula: '1144194734' },
        { id: 'c_4c12_2', nombre: 'LUIS ALBEIRO RINCON RIOS', rol: 'FAMILIAR', cedula: '149393382' }
      ]
    },
    {
      aptoCode: '4B22',
      propietario: { nombre: 'KAREN LAUDITH GOMES COLON', cedula: '1052992754', telefono: '3157261176' },
      personasAdicionales: [
        { id: 'c_4b22_1', nombre: 'JOSE DAVID GOMEZ COLON', rol: 'FAMILIAR', cedula: '1052988865', observaciones: 'TI' },
        { id: 'c_4b22_2', nombre: 'DAVID ROBERTO MARTINEZ GOMEZ', rol: 'FAMILIAR', cedula: '1103506644', observaciones: 'TI' }
      ],
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '1C24',
      propietario: { nombre: 'MIGUEL ANGEL BOTERO MONTOYA', cedula: '1006016312', telefono: '3024786533' },
      personasAdicionales: [
        { id: 'c_1c24_1', nombre: 'ALCIRA RUEDA FIGUEROA', rol: 'COPROPIETARIO', cedula: '31213062' },
        { id: 'c_1c24_2', nombre: 'ANA MILENA BOTERO RUEDA', rol: 'FAMILIAR', cedula: '31573066' }
      ],
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '4A52',
      propietario: { nombre: 'MARIA TERESA GONZALEZ OVALLE', cedula: '31858025', telefono: '3167944328' },
      personasAdicionales: [
        { id: 'c_4a52_1', nombre: 'CARLOS ALBERTO AMAYA AMAYA', rol: 'COPROPIETARIO', cedula: '16554952' }
      ],
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '4C33',
      propietario: { nombre: 'VIVIANA TORO SANCLEMENTE', cedula: '66971910', telefono: '3168284873' },
      personasAdicionales: [
        { id: 'c_4c33_1', nombre: 'ORLANDO CASTILLO', rol: 'COPROPIETARIO', cedula: '94430071' },
        { id: 'c_4c33_2', nombre: 'JUAN MIGUEL CASTILLO TORO', rol: 'FAMILIAR', cedula: '1109660645' },
        { id: 'c_4c33_3', nombre: 'DAVID CASTILLO TORO', rol: 'FAMILIAR', cedula: '1109671236', observaciones: 'TI' }
      ]
    },
    {
      aptoCode: '3B41',
      propietario: { nombre: 'SUSANA HERNADEZ DE HENAO', cedula: '41442377', telefono: '3117292753' },
      observaciones: 'PENDIENTE DOCUMENTOS'
    },
    {
      aptoCode: '4C34',
      propietario: { nombre: 'CARLOS ARTURO CRUZ', cedula: '16545497', telefono: '3113798447' },
      personasAdicionales: [
        { id: 'c_4c34_1', nombre: 'MARIA CRISTINA SALINAS SIERRA', rol: 'COPROPIETARIO', cedula: '31865379' },
        { id: 'c_4c34_2', nombre: 'ANDRES FELIPE CRUZ', rol: 'FAMILIAR', cedula: '16941518' }
      ]
    },
    {
      aptoCode: '4B13',
      propietario: { nombre: 'LUIS ELIECER BENAVIDES SALAZAR', cedula: '12977293', telefono: '3136014957' }
    },
    {
      aptoCode: '5A14',
      propietario: { nombre: 'LUISA FERNANDA SANTOS', cedula: '38562045', telefono: '3005763778' },
      personasAdicionales: [
        { id: 'c_5a14_1', nombre: 'RICARDO ALBERTO OBREGON', rol: 'COPROPIETARIO', cedula: '94428390' },
        { id: 'c_5a14_2', nombre: 'EMANUEL OBREGON SANTOS', rol: 'FAMILIAR', cedula: '1150689391', observaciones: 'TI' }
      ]
    },
    {
      aptoCode: '3B52',
      propietario: { nombre: 'DENILSON CASTILLO', cedula: '1004201156', telefono: '3022058410' },
      observaciones: 'PENDIENTE ENTREGA DOCUMENTOS'
    },
    {
      aptoCode: '2E23',
      propietario: { nombre: 'ALEXANDER MOSQUERA AGUIRRE', cedula: '1144051163', telefono: '3185608948' },
      personasAdicionales: [
        { id: 'c_2e23_1', nombre: 'JHOSELYN ROSERO TROCHEZ', rol: 'COPROPIETARIO', cedula: '1144181799' },
        { id: 'c_2e23_2', nombre: 'ISABELLA MOSQUERA ROSERO', rol: 'FAMILIAR', cedula: '1232824394', observaciones: 'RC' }
      ],
      observaciones: 'PENDIENTE ENVIO DOCUMENTOS'
    },
    {
      aptoCode: '4A53',
      propietario: { nombre: 'MARITZA RIASCOS', cedula: '31713124', telefono: '3185681996' },
      personasAdicionales: [
        { id: 'c_4a53_1', nombre: 'VICTOR HUGO RIASCOS SUAREZ', rol: 'COPROPIETARIO', cedula: '16946281' },
        { id: 'c_4a53_2', nombre: 'JOEL MATIAS RIASCOS', rol: 'FAMILIAR', cedula: '1232826100', observaciones: 'RCC' }
      ]
    },
    {
      aptoCode: '2A12',
      propietario: { nombre: 'DAVID ALOS ANDRADE', cedula: '1193389875', telefono: '3117170918' },
      personasAdicionales: [
        { id: 'c_2a12_1', nombre: 'DARLIN DAYANA ENRIQUEZ LOZANO', rol: 'COPROPIETARIO', cedula: '1006050941' }
      ]
    },
    {
      aptoCode: '3C43',
      propietario: { nombre: 'MARIA LUISA PALACIOS MOSQUERA', cedula: '35892754', telefono: '3122621447' },
      personasAdicionales: [
        { id: 'c_3c43_1', nombre: 'KEYLIN DAYANA MORENO PALACION', rol: 'FAMILIAR', cedula: '1078463710', observaciones: 'TI' },
        { id: 'c_3c43_2', nombre: 'JOHN ERIC MORENO PALACIOS', rol: 'FAMILIAR', cedula: '1078466179', observaciones: 'TI' }
      ]
    },
    {
      aptoCode: '3A12',
      propietario: { nombre: 'ZORAIDA DOMINGUEZ CAMPOS', cedula: '38730056', telefono: '3171198756' }
    },
    {
      aptoCode: '4B44',
      propietario: { nombre: 'LUZ MARINA HOLGUIN FERNANDEZ', cedula: '31929583', telefono: '3183659071' },
      personasAdicionales: [
        { id: 'c_4b44_1', nombre: 'LIGIA FERNANDEZ', rol: 'COPROPIETARIO', cedula: '31929583' },
        { id: 'c_4b44_2', nombre: 'JHONATHAN DAVIS VELEZ HOLGUIN', rol: 'FAMILIAR', cedula: '1192737921' }
      ],
      observaciones: 'PENDIENTE ENTREGA 2 COPIAS DE CEDULA'
    },
    {
      aptoCode: '4A34',
      propietario: { nombre: 'AURA LIGIA ARCE CEDEÑO', cedula: '31887910', telefono: '3174701103' }
    }
  ];
}
