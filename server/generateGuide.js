const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Ensure the directory exists
const publicDir = path.join(__dirname, '../client/public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
}

const outputPath = path.join(publicDir, 'Case_ID_Guide.pdf');
const doc = new PDFDocument();

doc.pipe(fs.createWriteStream(outputPath));

doc.fontSize(20).text('Case ID Reference Guide', { align: 'center' });
doc.moveDown();
doc.fontSize(12).text('This guide explains the prefix letters used in the automatically generated Case IDs within the Legal Management System.', { align: 'left' });
doc.moveDown(2);

const cases = [
    { type: 'Money Recovery', prefix: 'M', example: 'M1234' },
    { type: 'Damages Recovery', prefix: 'D', example: 'D5678' },
    { type: 'Appeals', prefix: 'A', example: 'A9012' },
    { type: 'Land Cases', prefix: 'L', example: 'L3456' },
    { type: 'Criminal Cases', prefix: 'C', example: 'C7890' },
    { type: 'Other Court / Legal Matters', prefix: 'O', example: 'O1122' }
];

doc.fontSize(14).text('Prefix Meanings:', { underline: true });
doc.moveDown();

cases.forEach(c => {
    doc.fontSize(12).text(`  - ${c.prefix}  :  ${c.type}`);
});

doc.moveDown(2);
doc.fontSize(14).text('Examples:', { underline: true });
doc.moveDown();

cases.forEach(c => {
    doc.fontSize(12).text(`  - A ${c.type} case might have the ID: ${c.example}`);
});

doc.end();

console.log('PDF Guide generated successfully at:', outputPath);
