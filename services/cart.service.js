// --------------------------------
// Calculate Cart Summary
// --------------------------------

const calculateCartSummary = (cart) => {

  let totalItems = 0;
  let subtotal = 0;

  const validItems = [];

  for (const item of cart.items) {

    if (!item.product) continue;

    totalItems += item.quantity;

  if (!item.variant) continue;

    const price =
  item.variant.salePrice ?? item.variant.price;

const itemTotal = price * item.quantity;

subtotal += itemTotal;

validItems.push({
  ...item.toObject(),
  itemTotal,
});
  }

  return {
    items: validItems,
    totalItems,
    subtotal,

    // Future Ready
    discount: 0,
    shipping: 0,
    tax: 0,
    grandTotal: subtotal,
  };
};

module.exports = {
  calculateCartSummary,
};