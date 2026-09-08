// zh-CN 业务模块
export default {
  order: {
    title: '订单列表',
    add: '新增订单',
    search: {
      orderNo: '订单号',
      orderNoPh: '请输入订单号',
      customer: '客户',
      customerPh: '请输入客户名',
      status: '状态',
      statusPh: '请选择',
    },
    status: {
      completed: '已完成',
      pending: '处理中',
      cancelled: '已取消',
    },
    col: {
      orderNo: '订单号',
      customer: '客户',
      product: '产品',
      quantity: '数量',
      amount: '金额',
      status: '状态',
      createdAt: '创建时间',
    },
    toast: {
      addWip: '新增功能开发中',
      viewPrefix: '查看订单: {{ no }}',
      editPrefix: '编辑订单: {{ no }}',
      deleted: '删除成功',
    },
    deleteConfirm: {
      title: '提示',
      body: '确定要删除订单 {{ no }} 吗？',
    },
  },
  invoice: {
    title: '发票管理',
  },
  procurement: {
    title: '采购管理',
  },
  influencer: {
    title: '网红管理',
  },
}
