import { itemsPerPage } from './dataManager.js';

export function renderPagination(currentPage, totalPages, changePageHandler) {
    let paginationHtml = `
        <button class="btn btn-danger" onclick="changePageHandler(${currentPage - 1})" ${currentPage === 1 ? 'disabled' : ''}>&lt;</button>
        <button class="btn btn-danger" onclick="changePageHandler(1)">Primero</button>
    `;

    if (totalPages > 5) {
        let startPage = Math.max(1, currentPage - 2);
        let endPage = Math.min(totalPages, currentPage + 2);
        
        if (endPage - startPage < 4) {
            if (currentPage < 3) endPage = Math.min(5, totalPages);
            else startPage = Math.max(totalPages - 4, 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHtml += `
                <button class="btn btn-danger" onclick="changePageHandler(${i})" 
                    ${currentPage === i ? 'style="background-color: #7a2640"' : ''}>
                    ${i}
                </button>
            `;
        }
    } else {
        for (let i = 1; i <= totalPages; i++) {
            paginationHtml += `
                <button class="btn btn-danger" onclick="changePageHandler(${i})" 
                    ${currentPage === i ? 'style="background-color: #7a2640"' : ''}>
                    ${i}
                </button>
            `;
        }
    }

    paginationHtml += `
        <button class="btn btn-danger" onclick="changePageHandler(${totalPages})">Último</button>
        <button class="btn btn-danger" onclick="changePageHandler(${currentPage + 1})" ${currentPage === totalPages ? 'disabled' : ''}>&gt;</button>
    `;

    document.querySelector("#pagination").innerHTML = paginationHtml;
}

export function paginateItems(items, currentPage) {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return {
        displayedItems: items.slice(startIndex, endIndex),
        totalPages: Math.ceil(items.length / itemsPerPage)
    };
}