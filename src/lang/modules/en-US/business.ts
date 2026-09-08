// en-US business module
export default {
  order: {
    title: 'Order List',
    add: 'Add Order',
    search: {
      orderNo: 'Order No.',
      orderNoPh: 'Enter order number',
      customer: 'Customer',
      customerPh: 'Enter customer name',
      status: 'Status',
      statusPh: 'Please select',
    },
    status: {
      completed: 'Completed',
      pending: 'In Progress',
      cancelled: 'Cancelled',
    },
    col: {
      orderNo: 'Order No.',
      customer: 'Customer',
      product: 'Product',
      quantity: 'Quantity',
      amount: 'Amount',
      status: 'Status',
      createdAt: 'Created At',
    },
    toast: {
      addWip: 'Add feature coming soon',
      viewPrefix: 'Viewing order: {{ no }}',
      editPrefix: 'Editing order: {{ no }}',
      deleted: 'Deleted successfully',
    },
    deleteConfirm: {
      title: 'Notice',
      body: 'Are you sure to delete order {{ no }}?',
    },
  },
  invoice: {
    title: 'Invoice Management',
  },
  procurement: {
    title: 'Procurement Management',
  },
  influencer: {
    title: 'Influencer Management',
  },
}
