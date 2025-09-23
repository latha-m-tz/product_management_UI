import React from 'react';

const Pagination = ({
    currentPage,
    totalPages,
    onPageChange,
    pageSize = 10,
    siblingCount = 1,
}) => {
    if (totalPages <= 1) return null;

    const range = (start, end) => {
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    };

    const getPaginationRange = () => {
        const totalPageNumbers = siblingCount * 2 + 5;
        if (totalPages <= totalPageNumbers) {
            return range(1, totalPages);
        }

        const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
        const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

        const showLeftDots = leftSiblingIndex > 2;
        const showRightDots = rightSiblingIndex < totalPages - 1;

        const firstPageIndex = 1;
        const lastPageIndex = totalPages;

        let pages = [];

        if (!showLeftDots && showRightDots) {
            let leftItemCount = 3 + 2 * siblingCount;
            let leftRange = range(1, leftItemCount);
            pages = [...leftRange, '...', totalPages];
        } else if (showLeftDots && !showRightDots) {
            let rightItemCount = 3 + 2 * siblingCount;
            let rightRange = range(totalPages - rightItemCount + 1, totalPages);
            pages = [firstPageIndex, '...', ...rightRange];
        } else if (showLeftDots && showRightDots) {
            let middleRange = range(leftSiblingIndex, rightSiblingIndex);
            pages = [firstPageIndex, '...', ...middleRange, '...', lastPageIndex];
        }

        return pages;
    };

    const paginationRange = getPaginationRange();

    return (
        <nav className="pagination">
            <button
                disabled={currentPage === 1}
                onClick={() => onPageChange(currentPage - 1)}
            >
                Prev
            </button>
            {paginationRange.map((page, idx) => {
                if (page === '...') {
                    return <span key={idx} className="pagination-ellipsis">...</span>;
                }
                return (
                    <button
                        key={page}
                        className={page === currentPage ? 'active' : ''}
                        onClick={() => onPageChange(page)}
                        disabled={page === currentPage}
                    >
                        {page}
                    </button>
                );
            })}
            <button
                disabled={currentPage === totalPages}
                onClick={() => onPageChange(currentPage + 1)}
            >
                Next
            </button>
        </nav>
    );
};

export default Pagination;