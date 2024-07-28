var categoryChart; 

function generateChart() {
    var productList = JSON.parse(localStorage.getItem("productList")) || [];

    var categoryData = {};
    productList.forEach(function(product) {
        if (categoryData[product.categoria]) {
            categoryData[product.categoria] += product.total;
        } else {
            categoryData[product.categoria] = product.total;
        }
    });

    var labels = Object.keys(categoryData);
    var values = Object.values(categoryData);

    if (categoryChart) {
        categoryChart.destroy();
    }

    var ctx = document.getElementById('categoryChart').getContext('2d');
    categoryChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{
                label: 'Total por cada categoría',
                data: values,
                backgroundColor: labels.map((_, i) => `hsl(${i * 360 / labels.length}, 70%, 50%)`),
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        font: {
                            size: 12
                        },
                        color: 'green'
                    }
                }
            }
        }
    });
}

document.addEventListener('DOMContentLoaded', (event) => {
    generateChart();

    document.getElementById('downloadPDF').addEventListener('click', function() {
        downloadPDF();
    });
});

//Los gráficos no se hacen, se descargan
function downloadChartAsPNG() {
    var link = document.createElement('a');
    link.href = categoryChart.toBase64Image();
    link.download = 'gráfico_categorías.png';
    link.click();
}

function downloadPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF('p', 'mm', 'letter');
    html2canvas(document.getElementById('categoryChart')).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgProps = pdf.getImageProperties(imgData);
        const imgWidth = 180;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        const pageHeight = pdf.internal.pageSize.getHeight();

        pdf.setFontSize(16);
        pdf.text('Total por categorías', 105, 10, null, null, 'center');

        let y = 20;

        if (y + imgHeight > pageHeight) {
            pdf.addPage();
            y = 20; 
        }
        pdf.addImage(imgData, 'PNG', 15, y, imgWidth, imgHeight);

        pdf.save('grafico_categorias.pdf');
    });
}
