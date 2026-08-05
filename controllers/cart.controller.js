const Cart = require("../models/cart.model");
const {validateProductId,validateQuantity,} = require("../validators/cart.validator");
const Product = require("../models/product.model");
const { calculateCartSummary,} = require("../services/cart.service");



const addToCart = async (req, res) => {
  try {

  const { productId,quantity,} = req.body;

const productIdError = validateProductId(productId);

if (productIdError) {
  return res.status(400).json({
    success: false,
    message: productIdError,
  });
}


const quantityError = validateQuantity(quantity);

if (quantityError) {
  return res.status(400).json({
    success: false,
    message: quantityError,
  });
}

const product = await Product.findById(productId);

if (!product) {
  return res.status(404).json({
    success: false,
    message: "Product not found.",
  });
}


if (!product.isActive) {
  return res.status(400).json({
    success: false,
    message: "Product is not available.",
  });
}
if (product.isDeleted) {
  return res.status(400).json({
    success: false,
    message: "Product is not available.",
  });
}

if (product.stock < quantity) {
  return res.status(400).json({
    success: false,
    message: "Insufficient stock.",
  });
}


let cart = await Cart.findOne({
  customer: req.user._id,
});
    

if (!cart) {

  cart = await Cart.create({
    customer: req.user._id,
    items: [],
  });

}

const existingItem = cart.items.find(

  (item) =>

    item.product.toString() === productId

);


if (existingItem) {

  existingItem.quantity += quantity;

}


else {

  cart.items.push({

    product: productId,

    quantity,

  });

}

await cart.save();

// Success Response
// --------------------------------

return res.status(200).json({
  success: true,
  message: "Product added to cart successfully.",
  cart,
});


  } catch (error) {

    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });

  }
};


const getCart = async (req, res) => {
  try {

  const cart = await Cart.findOne({
  customer: req.user._id,
}).populate({
  path: "items.product",
  select: "name slug price salePrice images stock",
    match: {
    isDeleted: false,
    isActive: true,
  },
});


if (!cart) {
  return res.status(200).json({
    success: true,
    message: "Cart is empty.",
    cart: {
      items: [],
    },
  });
}

const summary =
  calculateCartSummary(cart);


res.status(200).json({
  success: true,
  cart: summary,
});

  
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};
// --------------------------------
// Update Cart Item Quantity
// --------------------------------

const updateCartQuantity = async (req, res) => {
  try {

const { productId,quantity,} = req.body;
// --------------------------------
// Required Fields Validation
// --------------------------------

if (!productId || quantity === undefined) {
  return res.status(400).json({
    success: false,
    message: "Product ID and quantity are required.",
  });
}

// --------------------------------
// Quantity Validation
// --------------------------------

if (!Number.isInteger(quantity) || quantity < 1) {
  return res.status(400).json({
    success: false,
    message: "Quantity must be an integer greater than or equal to 1.",
  });
}
// --------------------------------
// Find Customer Cart
// --------------------------------

const cart = await Cart.findOne({
  customer: req.user._id,
});

if (!cart) {
  return res.status(404).json({
    success: false,
    message: "Cart not found.",
  });
}

// --------------------------------
// Find Cart Item
// --------------------------------

const cartItem = cart.items.find(
  (item) => item.product.toString() === productId
);

if (!cartItem) {
  return res.status(404).json({
    success: false,
    message: "Product not found in cart.",
  });
}
// --------------------------------
// Find Product
// --------------------------------

const product = await Product.findOne({
  _id: productId,
  isActive: true,
  isDeleted: false,
});

if (!product) {
  return res.status(404).json({
    success: false,
    message: "Product not found.",
  });
}

// --------------------------------
// Stock Validation
// --------------------------------

if (quantity > product.stock) {
  return res.status(400).json({
    success: false,
    message: `Only ${product.stock} item(s) available in stock.`,
  });
}


cartItem.quantity = quantity;

await cart.save();

// --------------------------------
// Success Response
// --------------------------------

res.status(200).json({
  success: true,
  message: "Cart updated successfully.",
});


  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// --------------------------------
// Remove Item From Cart
// --------------------------------

const removeCartItem = async (req, res) => {
  try {

    // --------------------------------
// Get Product ID
// --------------------------------

const { productId } = req.params;

// --------------------------------
// Find Customer Cart
// --------------------------------

const cart = await Cart.findOne({
  customer: req.user._id,
});

if (!cart) {
  return res.status(404).json({
    success: false,
    message: "Cart not found.",
  });
}

// --------------------------------
// Find Cart Item
// --------------------------------

const cartItem = cart.items.find(
  (item) => item.product.toString() === productId
);

if (!cartItem) {
  return res.status(404).json({
    success: false,
    message: "Product not found in cart.",
  });
}
// --------------------------------
// Remove Cart Item
// --------------------------------

cart.items = cart.items.filter(
  (item) => item.product.toString() !== productId
);

await cart.save();

// --------------------------------
// Success Response
// --------------------------------

res.status(200).json({
  success: true,
  message: "Product removed from cart successfully.",
});
   

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// --------------------------------
// Clear Cart
// --------------------------------

const clearCart = async (req, res) => {
  try {

    // --------------------------------
// Find Customer Cart
// --------------------------------

const cart = await Cart.findOne({
  customer: req.user._id,
});

if (!cart) {
  return res.status(404).json({
    success: false,
    message: "Cart not found.",
  });
}

// --------------------------------
// Clear Cart
// --------------------------------

cart.items = [];

await cart.save();

// --------------------------------
// Success Response
// --------------------------------

res.status(200).json({
  success: true,
  message: "Cart cleared successfully.",
});

  

  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


module.exports = {
  addToCart,
  getCart,
  updateCartQuantity,
  removeCartItem,
  clearCart
};