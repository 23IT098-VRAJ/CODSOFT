const CATEGORIES = ['Electronics', 'Clothing', 'Books', 'Home', 'Sports'];

const ORDER_STATUSES = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];

// Which status an order may move to from its current one.
const STATUS_TRANSITIONS = {
  Pending: ['Processing', 'Cancelled'],
  Processing: ['Shipped', 'Cancelled'],
  Shipped: ['Delivered'],
  Delivered: [],
  Cancelled: [],
};

// A customer may cancel only before the order leaves the warehouse.
const USER_CANCELLABLE = ['Pending', 'Processing'];

const FREE_SHIPPING_THRESHOLD = 999;
const SHIPPING_FEE = 99;
const MAX_QTY_PER_ITEM = 10;
const LOW_STOCK_THRESHOLD = 10;

const shippingFeeFor = (itemsTotal) => (itemsTotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE);

module.exports = {
  CATEGORIES,
  ORDER_STATUSES,
  STATUS_TRANSITIONS,
  USER_CANCELLABLE,
  FREE_SHIPPING_THRESHOLD,
  SHIPPING_FEE,
  MAX_QTY_PER_ITEM,
  LOW_STOCK_THRESHOLD,
  shippingFeeFor,
};
