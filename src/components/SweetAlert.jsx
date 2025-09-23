import React from 'react';
import Swal from 'sweetalert2';

const showDeleteAlert = (onConfirm, message = 'Are you sure you want to delete this item?') => {
    Swal.fire({
        title: 'Delete Confirmation',
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Delete',
        cancelButtonText: 'Cancel',
    }).then((result) => {
        if (result.isConfirmed) {
            onConfirm();
            Swal.fire('Deleted!', 'The item has been deleted.', 'success');
        }
    });
};

export default showDeleteAlert;