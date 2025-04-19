export function setupExportButtons(page) {
    switch(page) {
        case 'balance':
            document.getElementById('downloadPDF')?.addEventListener('click', () => {
                downloadSingleChartPDF('categoryChart');
            });
            break;
        case 'dashboard':
            document.getElementById('downloadPDF')?.addEventListener('click', async () => {
                await downloadChartsPDF(
                    ['averageSpendingChart', 'mostExpensiveCategoryChart', 'leastExpensiveCategoryChart'],
                    'Estadísticas',
                    getMostRegisteredCategoryText()
                );
            });
            break;
        case 'index':
            document.getElementById('exportExcel')?.addEventListener('click', exportToExcel);
            document.getElementById('exportJSON')?.addEventListener('click', exportToJSON);
            document.getElementById('importJSON')?.addEventListener('change', importFromJSON);
            break;
    }
}