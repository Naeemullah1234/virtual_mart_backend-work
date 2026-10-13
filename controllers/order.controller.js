const mongoose = require("mongoose");

const Order = require("../models/order.model");
const Cart = require("../models/cart.model");
const Address = require("../models/address.model");
const Product = require("../models/product.model");
const ProductVariant = require("../models/productVariant.model");
const { generateInvoicePDF } = require("../utils/generateInvoicePDF");
const { sendInvoiceEmail } = require("../utils/sendEmail");
const Customer = require("../models/customer.model");
const fs = require("fs");
const path = require("path");


// ========================================
// Generate Order Number
// ========================================

const generateOrderNumber = () => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const random = Math.floor(100000 + Math.random() * 900000);

  return `CM-${year}${month}${day}-${random}`;
};


// ========================================
// Create Order / Checkout
// ========================================

const createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { addressId, paymentMethod } = req.body;

    // ----------------------------------------
    // Validate Request
    // ----------------------------------------

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: "Address ID is required.",
      });
    }

    if (!paymentMethod) {
      return res.status(400).json({
        success: false,
        message: "Payment method is required.",
      });
    }

    if (!["cod", "online"].includes(paymentMethod)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment method.",
      });
    }

    // ----------------------------------------
    // Find Customer Address
    // ----------------------------------------

    const address = await Address.findOne({
      _id: addressId,
      customer: req.user._id,
      isActive: true,
    });

    if (!address) {
      return res.status(404).json({
        success: false,
        message: "Address not found or inactive.",
      });
    }

    // ----------------------------------------
    // Find Cart
    // ----------------------------------------

    const cart = await Cart.findOne({
      customer: req.user._id,
    });

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Cart is empty.",
      });
    }

    // ----------------------------------------
    // Start Transaction
    // ----------------------------------------

    session.startTransaction();

    const orderItems = [];

    let subtotal = 0;

    // ----------------------------------------
    // Validate Cart Items + Stock
    // ----------------------------------------

    for (const cartItem of cart.items) {
      const product = await Product.findOne({
        _id: cartItem.product,
        isActive: true,
        isDeleted: false,
      }).session(session);

      if (!product) {
        throw new Error(
          "One or more products in your cart are no longer available."
        );
      }

      const variant = await ProductVariant.findOne({
        _id: cartItem.variant,
        product: cartItem.product,
      }).session(session);

      if (!variant) {
        throw new Error(
          `Variant for product "${product.name}" was not found.`
        );
      }

      // ----------------------------------------
      // Stock Check
      // ----------------------------------------

      if (variant.stock < cartItem.quantity) {
        throw new Error(
          `${product.name} has only ${variant.stock} item(s) available in stock.`
        );
      }

      // ----------------------------------------
      // Price
      // ----------------------------------------

      const salePrice =
        variant.salePrice !== null && variant.salePrice !== undefined
          ? variant.salePrice
          : variant.price;

      const itemTotal = salePrice * cartItem.quantity;

      subtotal += itemTotal;

      // ----------------------------------------
      // Snapshot Product Data
      // ----------------------------------------

      let image = "";

      if (Array.isArray(variant.images) && variant.images.length > 0) {
        const primaryImage = variant.images.find(
          (item) => item.isPrimary === true
        );

        image = primaryImage
          ? primaryImage.url
          : variant.images[0].url;
      }

      orderItems.push({
        product: product._id,
        variant: variant._id,
        productName: product.name,
        sku: variant.sku,
        attributes: variant.attributes.map((attribute) => ({
          key: attribute.key,
          value: attribute.value,
        })),
        image,
        price: variant.price,
        salePrice,
        quantity: cartItem.quantity,
        itemTotal,
      });
    }

    // ----------------------------------------
    // Shipping / Tax / Discount
    // ----------------------------------------

    const discount = 0;
    
    let shipping = 0;

if (address.country.toLowerCase() !== "pakistan") {
  // International
  shipping = 4500;
} else if (address.city.toLowerCase() === "karachi") {
  // Karachi → Karachi
  shipping = 170;
} else {
  // Pakistan → Other City
  shipping = 310;
}

    const tax = 0;

    const grandTotal =
      subtotal - discount + shipping + tax;

    // ----------------------------------------
    // Reduce Stock
    // ----------------------------------------

    for (const cartItem of cart.items) {
      const updatedVariant =
        await ProductVariant.findOneAndUpdate(
          {
            _id: cartItem.variant,
            product: cartItem.product,
            stock: { $gte: cartItem.quantity },
          },
          {
            $inc: {
              stock: -cartItem.quantity,
            },
          },
          {
            new: true,
            session,
          }
        );

      if (!updatedVariant) {
        throw new Error(
          "Stock changed while placing the order. Please try again."
        );
      }
    }

    // ----------------------------------------
    // Create Order
    // ----------------------------------------

    const order = await Order.create(
      [
        {
          customer: req.user._id,

          orderNumber: generateOrderNumber(),

          items: orderItems,

          shippingAddress: {
            fullName: address.fullName,
            phone: address.phone,
            email: address.email,
            country: address.country,
            state: address.state,
            city: address.city,
            postalCode: address.postalCode,
            addressLine1: address.addressLine1,
            addressLine2: address.addressLine2,
            landmark: address.landmark,
            label: address.label,
          },

          subtotal,
          discount,
          shipping,
          tax,
          grandTotal,

          paymentMethod,

          paymentStatus:
            paymentMethod === "cod"
              ? "pending"
              : "pending",

          orderStatus: "pending",
        },
      ],
      { session }
    );

    // ----------------------------------------
    // Clear Cart
    // ----------------------------------------

    cart.items = [];

    await cart.save({ session });

    // ----------------------------------------
    // Commit Transaction
    // ----------------------------------------

     await session.commitTransaction();
session.endSession();

const createdOrder = order[0];

let invoiceEmailSent = false;

try {

  const customer = await Customer.findById(req.user._id).select("email");
  
   const invoice = await generateInvoicePDF(createdOrder,customer);

  if (customer && customer.email) {
    await sendInvoiceEmail(
      customer.email,
      createdOrder,
      invoice.filePath
    );

    invoiceEmailSent = true;
  }
} catch (invoiceError) {
  console.log("INVOICE ERROR:", invoiceError);
}
return res.status(201).json({
  success: true,
  message: invoiceEmailSent
    ? "Order placed successfully and invoice emailed."
    : "Order placed successfully, but invoice email could not be sent.",
  invoiceEmailSent,
  order: createdOrder,
});

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    console.log("CREATE ORDER ERROR:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to place order.",
    });
  }
};

// ========================================
// Get Customer Orders
// ========================================

const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: orders.length,
      orders,
    });
  } catch (error) {
    console.log("GET MY ORDERS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// ========================================
// Get Single Customer Order
// ========================================

const getMyOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid order ID.",
      });
    }

    const order = await Order.findOne({
      _id: id,
      customer: req.user._id,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found.",
      });
    }

    return res.status(200).json({
      success: true,
      order,
    });
  } catch (error) {
    console.log("GET MY ORDER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};


module.exports = {
  createOrder,
   getMyOrders,
    getMyOrderById,
};