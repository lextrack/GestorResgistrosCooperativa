export async function downloadChartsPDF(chartIds, title = 'Estadísticas', mostRegisteredCategoryText = '') {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'letter');
    
    const pageWidth = pdf.internal.pageSize.getWidth();
    const margin = 15;
    const imgWidth = pageWidth - 2 * margin;

    pdf.setFontSize(15);
    pdf.text(title, pageWidth / 2, margin / 2, { align: 'center' });
    
    if (mostRegisteredCategoryText) {
        pdf.setFontSize(8);
        pdf.text(mostRegisteredCategoryText, pageWidth / 2, margin, { align: 'center' });
    }

    let y = margin + 10;

    for (const chartId of chartIds) {
        try {
            const canvas = await html2canvas(document.getElementById(chartId));
            const imgData = canvas.toDataURL('image/png');
            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            if (y + imgHeight > pdf.internal.pageSize.getHeight()) {
                pdf.addPage();
                y = margin;
            }

            pdf.addImage(imgData, 'PNG', margin, y, imgWidth, imgHeight);
            y += imgHeight + 10;
        } catch (error) {
            console.error(`Error al generar el canvas para el gráfico ${chartId}:`, error);
            throw error;
        }
    }

    pdf.save('gráficos_estadísticos.pdf');
}

export function downloadSingleChartPDF(chartId, title = 'Total por categorías') {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'letter');
    
    html2canvas(document.getElementById(chartId)).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = 180;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        pdf.setFontSize(16);
        pdf.text(title, 105, 10, null, null, 'center');
        pdf.addImage(imgData, 'PNG', 15, 20, imgWidth, imgHeight);
        pdf.save('grafico_categorias.pdf');
    });
}