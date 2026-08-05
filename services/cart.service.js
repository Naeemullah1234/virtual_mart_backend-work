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

    const price =
      item.product.salePrice || item.product.price;

    subtotal += price * item.quantity;

    validItems.push(item);
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