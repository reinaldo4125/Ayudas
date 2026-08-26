import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  Table, 
  TableRow, 
  TableCell, 
  WidthType, 
  AlignmentType, 
  HeadingLevel,
  Header,
  Footer,
  PageNumber
} from 'docx';
import { saveAs } from 'file-saver';
import { PropertyRecord } from '../types';

/**
 * Generates a Microsoft Word (.docx) document containing ONLY properties
 * that have filled owner data, designed specifically for physical signatures.
 */
export async function generateSignaturesDocx(properties: PropertyRecord[], titleText: string = 'PLANILLA DE FIRMAS Y CONTROL - CENSO DE PROPIETARIOS') {
  // Filter properties that have filled owner names
  const filledProperties = properties.filter(
    p => p.propietario?.nombre && p.propietario.nombre.trim().length > 0
  );

  // Sort logically by Agrupacion, Torre, Piso, Apto Code
  const sortedProperties = [...filledProperties].sort((a, b) => {
    if (a.agrupacion !== b.agrupacion) return a.agrupacion.localeCompare(b.agrupacion, undefined, { numeric: true });
    if (a.torre !== b.torre) return a.torre.localeCompare(b.torre);
    if (a.piso !== b.piso) return a.piso - b.piso;
    return a.aptoCode.localeCompare(b.aptoCode, undefined, { numeric: true });
  });

  const currentDate = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Table Headers
  const tableHeaderRow = new TableRow({
    tableHeader: true,
    cantSplit: true,
    children: [
      new TableCell({
        width: { size: 6, type: WidthType.PERCENTAGE },
        shading: { fill: '1E293B' }, // Slate 800
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: '#', bold: true, color: 'FFFFFF', size: 18 })] })]
      }),
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        shading: { fill: '1E293B' },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'APTO', bold: true, color: 'FFFFFF', size: 18 })] })]
      }),
      new TableCell({
        width: { size: 14, type: WidthType.PERCENTAGE },
        shading: { fill: '1E293B' },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'AGRUP. / TORRE', bold: true, color: 'FFFFFF', size: 18 })] })]
      }),
      new TableCell({
        width: { size: 26, type: WidthType.PERCENTAGE },
        shading: { fill: '1E293B' },
        children: [new Paragraph({ alignment: AlignmentType.LEFT, children: [new TextRun({ text: 'PROPIETARIO(A)', bold: true, color: 'FFFFFF', size: 18 })] })]
      }),
      new TableCell({
        width: { size: 14, type: WidthType.PERCENTAGE },
        shading: { fill: '1E293B' },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'CÉDULA / DOC', bold: true, color: 'FFFFFF', size: 18 })] })]
      }),
      new TableCell({
        width: { size: 13, type: WidthType.PERCENTAGE },
        shading: { fill: '1E293B' },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'TELÉFONO', bold: true, color: 'FFFFFF', size: 18 })] })]
      }),
      new TableCell({
        width: { size: 15, type: WidthType.PERCENTAGE },
        shading: { fill: '1E293B' },
        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'FIRMA / RECIBIDO', bold: true, color: 'FFFFFF', size: 18 })] })]
      }),
    ]
  });

  // Table Data Rows
  const tableDataRows = sortedProperties.map((prop, idx) => {
    const isEven = idx % 2 === 0;
    const bgFill = isEven ? 'FFFFFF' : 'F8FAFC'; // Alternating white and slate-50

    const ownerName = prop.propietario?.nombre || 'SIN NOMBRE';
    const ownerCedula = prop.propietario?.cedula || '---';
    const ownerPhone = prop.propietario?.telefono || '---';

    return new TableRow({
      cantSplit: true,
      children: [
        // # Index
        new TableCell({
          shading: { fill: bgFill },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `${idx + 1}`, size: 18, color: '475569' })] })]
        }),
        // Apto Code
        new TableCell({
          shading: { fill: bgFill },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: prop.aptoCode, bold: true, size: 20, color: '0F172A' })] })]
        }),
        // Agrup / Torre
        new TableCell({
          shading: { fill: bgFill },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: `Agr. ${prop.agrupacion} • T.${prop.torre}`, size: 17, color: '334155' })] })]
        }),
        // Propietario Name
        new TableCell({
          shading: { fill: bgFill },
          children: [
            new Paragraph({ 
              alignment: AlignmentType.LEFT, 
              children: [
                new TextRun({ text: ownerName.toUpperCase(), bold: true, size: 18, color: '0F172A' }),
                prop.tipoOcupante === 'ARRENDADO' ? new TextRun({ text: ' (Arrendado)', italics: true, size: 15, color: 'D97706' }) : new TextRun({ text: '' })
              ] 
            })
          ]
        }),
        // Cédula
        new TableCell({
          shading: { fill: bgFill },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ownerCedula, size: 17, color: '334155' })] })]
        }),
        // Teléfono
        new TableCell({
          shading: { fill: bgFill },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: ownerPhone, size: 17, color: '334155' })] })]
        }),
        // Firma Box
        new TableCell({
          shading: { fill: bgFill },
          children: [
            new Paragraph({ 
              alignment: AlignmentType.CENTER, 
              children: [
                new TextRun({ text: '\n_____________________\nFirma', size: 14, color: '94A3B8' })
              ] 
            })
          ]
        })
      ]
    });
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 720,    // 0.5 inch
              bottom: 720,
              left: 720,
              right: 720
            }
          }
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({ text: 'CENSO OFICIAL SECTOR 1 • PLANILLA DE FIRMAS DE PROPIETARIOS', size: 14, color: '64748B', italics: true })
                ]
              })
            ]
          })
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: 'Planilla Oficial de Verificación y Firmas • ', size: 14, color: '64748B' }),
                  new TextRun({ text: 'Página ', size: 14, color: '64748B' }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 14, color: '64748B' })
                ]
              })
            ]
          })
        },
        children: [
          // Header Banner
          new Paragraph({
            alignment: AlignmentType.CENTER,
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 120 },
            children: [
              new TextRun({
                text: 'PLANILLA DE FIRMAS Y CONTROL DE PROPIETARIOS',
                bold: true,
                size: 28,
                color: '1E293B'
              })
            ]
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 },
            children: [
              new TextRun({
                text: 'SECTOR 1 - URBANIZACIÓN CHIMINANGOS',
                bold: true,
                size: 22,
                color: '4F46E5'
              }),
              new TextRun({
                text: ' • CONTROL DE ASISTENCIA Y CONFORMIDAD',
                size: 20,
                color: '64748B'
              })
            ]
          }),

          // Metadata Info Box Paragraph
          new Paragraph({
            spacing: { after: 240 },
            children: [
              new TextRun({ text: '📌 NOTA IMPORTANTE: ', bold: true, color: '1E293B', size: 18 }),
              new TextRun({
                text: `Esta planilla contiene únicamente los `,
                size: 18,
                color: '334155'
              }),
              new TextRun({
                text: `${sortedProperties.length} apartamentos `,
                bold: true,
                color: '4F46E5',
                size: 18
              }),
              new TextRun({
                text: `cuyos datos de propietarios ya han sido diligenciados en el censo. Se imprime con el propósito de recabar firmas físicas de conformidad, asistencia o autorización.`,
                size: 18,
                color: '334155'
              }),
              new TextRun({
                text: `\nFecha de Expedición: ${currentDate}`,
                italics: true,
                size: 16,
                color: '64748B'
              })
            ]
          }),

          // Main Table
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [tableHeaderRow, ...tableDataRows]
          }),

          // Signatures Footer Section for Admin / Junta
          new Paragraph({
            spacing: { before: 400, after: 100 },
            children: [
              new TextRun({
                text: '_________________________________________               _________________________________________',
                color: '64748B'
              })
            ]
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: 'Firma Responsable Censo / Junta Directiva                    Firma Administrador(a) Sector 1',
                bold: true,
                size: 16,
                color: '334155'
              })
            ]
          })
        ]
      }
    ]
  });

  // Export to Blob and download as .docx
  const blob = await Packer.toBlob(doc);
  const dateStamp = new Date().toISOString().slice(0, 10);
  saveAs(blob, `Planilla_Firmas_Propietarios_Sector1_${dateStamp}.docx`);
}
