export function paginate({ items, page, pageSize, renderPage, containerId, onPageChange }) {
    const total     = items.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage  = Math.min(Math.max(1, page), totalPages);
    const from      = (safePage - 1) * pageSize;
    const to        = Math.min(from + pageSize, total);
    const pageItems = items.slice(from, to);

    renderPage(pageItems, from + 1, to, total);
    renderControls(containerId, safePage, totalPages, total, from + 1, to, onPageChange);

    return safePage;
}

function renderControls(containerId, page, totalPages, total, from, to, onPageChange) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (totalPages <= 1) {
        container.innerHTML = '';
        return;
    }

    const pages  = buildPageNumbers(page, totalPages);
    const btnCls = (p) => `pagination-btn${p === page ? ' active' : ''}`;

    container.innerHTML = `
    <div class="pagination">
      <span class="pagination-info">${from}–${to} de ${total}</span>
      <div class="pagination-controls">
        <button class="pagination-btn pagination-prev" data-page="${page - 1}" ${page === 1 ? 'disabled' : ''}>
          <i class="ri-arrow-left-s-line"></i>
        </button>
        ${pages.map(p =>
            p === '…'
                ? `<span class="pagination-ellipsis">…</span>`
                : `<button class="${btnCls(p)}" data-page="${p}">${p}</button>`
        ).join('')}
        <button class="pagination-btn pagination-next" data-page="${page + 1}" ${page === totalPages ? 'disabled' : ''}>
          <i class="ri-arrow-right-s-line"></i>
        </button>
      </div>
    </div>`;

    container.querySelectorAll('[data-page]').forEach(btn => {
        if (btn.disabled) return;
        btn.addEventListener('click', () => onPageChange(parseInt(btn.dataset.page)));
    });
}

function buildPageNumbers(current, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages = [1];
    if (current > 3)  pages.push('…');
    for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
    if (current < total - 2) pages.push('…');
    pages.push(total);
    return pages;
}
